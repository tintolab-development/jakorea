/**
 * TanStack Query 키 팩토리 — 도메인별로 `.all()`로 묶어 invalidation 하기 쉽게 유지.
 *
 * - 루트는 `['cms', …]` 로 통일 (대시보드 `dashboardQueryKeys`와 동일 계열).
 * - 기능 전용 키는 feature 폴더에 두고, 여기서는 공통·인증 등 앱 전역만 확장.
 *
 * API 연동 규칙: `queryKey`는 문자열 배열 리터럴을 흩뿌리지 말고 팩토리로만 조합한다.
 * mock → 실 API 전환 시 동일 리소스면 키를 유지하고 `queryFn`에서만 분기하는 것이 기본
 * (스키마가 달라 캐시를 분리해야 할 때만 키에 버전 접미사 등을 둔다).
 * 상세: `docs/api/api-routes-and-client.md` · `.cursor/rules/data/api-routes-and-client.md`
 */

export const cmsQueryKeys = {
  all: ['cms'] as const,

  auth: {
    all: () => [...cmsQueryKeys.all, 'auth'] as const,
    /** 세션·토큰 검증 등 */
    session: () => [...cmsQueryKeys.auth.all(), 'session'] as const,
    /** 현재 관리자/사용자 프로필 */
    me: () => [...cmsQueryKeys.auth.all(), 'me'] as const,
  },
} as const
