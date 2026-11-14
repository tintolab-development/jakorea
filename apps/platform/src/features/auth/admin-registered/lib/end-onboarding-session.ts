import { logoutPortalSession } from '@/features/auth/session/portal-logout'
import { setAdminOnboardingRequired } from '@/shared/lib/admin-onboarding-session'

/**
 * 관리자 등록 온보딩 완료 — 로그인 세션을 끝내고 지금 화면(완료 안내)에 머문다.
 * 헤더·세션 경고 모달과 같은 공통 경로(서버 Logout + 로컬 토큰·캐시·Wizard 정리)를 쓰고,
 * 온보딩 진행 중 표시도 지워 이후 로그인 필요 가드가 온보딩 안내로 보내지 않게 한다.
 * StrictMode 이중 effect 호출은 `logoutPortalSession` single-flight가 흡수한다.
 */
export function endAdminRegisteredOnboardingSession() {
  setAdminOnboardingRequired(false)
  void logoutPortalSession({ redirectTo: null })
}
