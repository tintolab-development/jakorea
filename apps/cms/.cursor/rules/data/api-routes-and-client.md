---
priority: medium
always_include: false
category: data
---

# API 경로·apiClient (실 백엔드 연동)

> 상세·환경 표·체크리스트: [api-routes-and-client.md](../../../docs/api/api-routes-and-client.md)  
> Mock 시대 스펙 요약: [api-spec-mock.md](./api-spec-mock.md)

## 경로

- **단일 출처:** 상대 경로는 `apps/cms/src/shared/config/api-paths.ts` 또는 `shared/config/api/<domain>.ts`로 분리 후 한곳에서 re-export. 페이지·UI·훅에 URL 문자열 하드코딩 금지.
- **형식:** 항상 `/`로 시작하는 절대 경로(앱 루트 기준). `getApiBaseUrl()` 오리진에는 `/api`를 붙이지 않음 — 경로 상수에 `/api/...` 포함.
- **동적 세그먼트:** `encodeURIComponent(id)` 등으로 조합. 빌더 함수 `(programId: string) => \`${prefix}/programs/${encodeURIComponent(programId)}\`` 권장.
- **admin vs 일반:** Swagger의 `/api/admin/...`와 `/api/...` 쌍은 prefix를 분리하거나 `scope: 'admin' | 'public'` 인자 빌더로 혼동 방지.

## HTTP 클라이언트

- **신규 실 API:** `import { apiClient } from '@/shared/api'` (또는 named `axiosClient`). 인터셉터·토큰·`withCredentials` 일관성 유지.
- **직접 import 금지(기본):** `features/*`에서 `@/shared/instance/axios-instance` 직접 import하지 말 것. 예외 시 PR에 이유 명시.
- **제2 인스턴스 금지:** 동일 앱에서 `axios.create`로 별도 클라이언트 추가 금지.
- **베이스 URL 판별:** `getApiBaseUrl` / `isRemoteApiConfigured`는 `@/shared/lib/api-remote-env` 또는 `@/shared/api` re-export 사용. `auth-store` ↔ `axios-instance` 순환을 피하기 위해 env 전용 모듈에 둠.

## mock → 실 API 점진 전환

- `apps/cms/src/shared/config/real-api-modules.ts`: 새 도메인은 `REAL_API_MODULE_KEYS`에 키 추가 후 `isRealApiModuleEnabled('키')`로만 실 호출 분기.
- **분기 위치:** 서비스·`entities/*/api` 레이어. UI는 mock/실을 몰라야 함.
- **레거시:** 기존 `fetch` + `getApiBaseUrl()` 패턴은 유지 허용. **신규 연동은 apiClient 우선.**

## TanStack Query 키 (API와 연동)

- **팩토리 단일 출처:** `queryKey`는 문자열 배열을 페이지에 직접 흩뿌리지 말고, `cmsQueryKeys` 또는 `features/<도메인>/api/*-query-keys.ts`의 **함수**로만 조합. `@/shared/api`에서 `cmsQueryKeys` re-export.
- **루트 접두:** 신규 키 트리는 `['cms', …]`로 시작해 대시보드 `dashboardQueryKeys` 등과 충돌·중복 탐색을 줄인다.
- **리소스 정체성:** `queryKey`에 **캐시를 구분하는 입력만** 넣는다 (예: `programId`, 필터 해시). mock→실 전환 시 **같은 리소스면 같은 키**를 유지하고, `queryFn` 안에서만 `isRealApiModuleEnabled` / fetcher vs mock을 갈라 **키는 바꾸지 않는다** (데이터 형이 달라 캐시를 버려야 할 때만 버전 접미사 `v2` 등을 도입).
- **무효화 범위:** 뮤테이션 후 `queryClient.invalidateQueries({ queryKey: …Domain.all() })`는 **해당 API 도메인**과 같은 팩토리의 `all()` / 상위 접두를 쓴다. 새 실 API 모듈을 추가하면 같은 도메인의 query 키 팩토리에 `all()`이 있어야 한다.
- **인증 연동:** 로그아웃·세션 만료 시 `cmsQueryKeys.auth.all()` 등 인증·`me` 관련 캐시 무효화를 고려.

## 관련 파일

- 경로: `src/shared/config/api-paths.ts`
- 클라이언트·Query 키 진입: `src/shared/api/client.ts`, `src/shared/api/query-keys.ts`, `src/shared/instance/axios-instance.ts`
- env: `src/shared/lib/api-remote-env.ts`
- 프록시: `vite.config.ts` (`/api` → `VITE_API_SERVER` 등)

**Last updated:** 2026-05-11
