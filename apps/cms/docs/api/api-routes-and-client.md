# CMS API 경로·apiClient 협업 가이드

실 백엔드(Swagger/OpenAPI)와 점진적으로 맞추기 위한 **경로 상수**, **HTTP 클라이언트**, **TanStack Query 키**, **환경 변수**, **mock 전환** 규칙을 정리합니다.

Cursor 에이전트·짧은 규칙: [`.cursor/rules/data/api-routes-and-client.md`](../../.cursor/rules/data/api-routes-and-client.md)

Mock 시대 API 요약(엔티티별 mock 서비스): [api-spec-mock.md](../../.cursor/rules/data/api-spec-mock.md)

---

## 환경 변수 요약

| 변수 | 역할 | 브라우저 Network에 보이는 요청 |
|------|------|--------------------------------|
| `VITE_API_BASE_URL` | 브라우저가 **직접** 호출할 백엔드 오리진 (끝 `/` 없이). | `https://<백엔드>/api/...` (크로스 오리진 — **CORS** 필요) |
| `VITE_API_SERVER` | 로컬 dev에서만: Vite가 **`/api` → 이 오리진**으로 프록시. | `http://localhost:3000/api/...` (같은 출처로 보임; 실제는 서버가 upstream 호출) |
| `VITE_DEV_PROXY_TARGET` / `VITE_NGROK_SERVER` | `VITE_API_SERVER`와 동일 역할(하위 호환·주석용 이름). | 위와 동일 |
| `VITE_REAL_API_MODULES` | 쉼표 구분 모듈 키. **나열된 것만** 실 API 호출. | 해당 모듈이 켜진 요청만 실 서버로 감 |
| `VITE_ADMIN_AUTH_API_PREFIX` | 관리자 인증 경로 prefix 덮어쓰기. | 기본 `/api/admin/auth` |
| `VITE_AUTH_REFRESH_PATH` | 리프레시 토큰 POST 경로. | 기본 `/api/auth/refresh` |
| `VITE_NGROK_SKIP_BROWSER_WARNING` | ngrok 무료 호스트 경고 우회 헤더 값. | 비워도 `VITE_API_SERVER`가 ngrok이면 프록시가 기본값(`69420`) 전달 |

**프록시 사용 시:** DevTools에는 **항상 `localhost:3000`** 만 보이는 것이 정상입니다. Postman처럼 ngrok 호스트가 보이게 하려면 `VITE_API_BASE_URL`만 ngrok으로 두고 `VITE_API_SERVER`는 비웁니다.

**`VITE_REAL_API_MODULES`:** 미설정·빈 문자열이면 백엔드 URL이 있어도 **모든 모듈 mock** (관리자 이메일 로그인은 mock + MFA 플로). `adminAuth,textbooks`처럼 넣으면 **목록에 있는 키만** 실 호출.

---

## API 경로 관리

### 원칙

1. **경로 문자열은 한곳** — `apps/cms/src/shared/config/api-paths.ts`에서 시작해, 도메인이 늘면 파일을 쪼갬 (아래).
2. **오리진과 경로 분리** — `getApiBaseUrl()`은 스킴+호스트(+포트)만. 경로 상수는 `/api/...`부터 적는다.
3. **UI/페이지에 URL 하드코딩 금지** — 훅·서비스·fetcher에서만 `apiClient` + 경로 상수 사용.

### 디렉터리 확장 예시

`api-paths.ts`가 길어지면:

```text
src/shared/config/
  api-paths.ts          # re-export만 (선택)
  api/
    admin-auth.ts       # adminAuthPaths
    programs.ts         # programPaths, programDetailInfoPaths …
    notices.ts
```

`api-paths.ts`에서 `export * from './api/programs'` 식으로 모아서 기존 import 경로 `@/shared/config/api-paths`를 유지할 수 있다.

### admin vs 일반 API

Swagger에 `/api/admin/programs/...`와 `/api/programs/...`가 같이 있으면:

- prefix 상수를 `adminProgramsPrefix`, `programsPrefix`로 나누거나
- `programDetailVolunteer(programId, scope: 'admin' | 'public')`처럼 **한 빌더**에서 분기해 실수를 줄인다.

### 동적 ID

```ts
`${prefix}/notices/${encodeURIComponent(id)}`
```

---

## apiClient 사용

### 진입점

```ts
import { apiClient, axiosClient, getApiBaseUrl, isRemoteApiConfigured } from '@/shared/api'
```

- **`apiClient` / `axiosClient`**: 동일 인스턴스(`default` export vs named).
- **`getApiBaseUrl`**: `fetch` 기반 레거시와 URL 조합 시 사용.
- **직접 `@/shared/instance/axios-instance` import는 지양** — `@/shared/api`로 통일 (예외는 PR에 사유).

### 동작 요약

- `withCredentials: true` — 쿠키 세션과 병행 가능.
- 요청 인터셉터: `useAuthStore`의 Bearer 토큰 자동 부착.
- 응답 인터셉터: 비즈니스 코드 범위 등 토큰 갱신 로직 — 상세는 소스 주석 참고.

### 레거시 `fetch`

`features/posts/api/admin-notice-service.ts` 등 기존 `fetch` + `getApiBaseUrl()` 패턴은 당분간 유지 가능. **새로 붙이는 실 API는 `apiClient` 우선.**

---

## TanStack Query 키 (API·캐시 연동)

Query 캐시는 **HTTP URL과 1:1이 아니라**, `queryKey` 튜플로 식별된다. 실 API 전환과 맞물리게 하려면 아래를 지킨다.

### 동작 원리 (팀이 공유할 인식)

1. **`queryKey`가 같으면** TanStack Query는 같은 캐시 슬롯으로 본다 (같은 `queryFn` 가정).
2. **`queryFn`만 바꾸고** mock → 실 API로 바꿀 때는, **리소스 단위가 동일하면 `queryKey`는 유지**하는 것이 보통 맞다. 그래야 전환 전후로 캐시 무효화·프리패치 규칙이 그대로 통한다.
3. **mock과 실 API의 응답 스키마가 다르면** 캐시를 섞으면 안 되므로, 그때만 `queryKey`에 버전 접미사(예: `['cms','programs', id, 'detail', 'v2']`)를 두는 식으로 **의도적으로 캐시 분리**한다.
4. **`invalidateQueries`**는 `queryKey` **접두(prefix)** 매칭이므로, 도메인별로 `…all()` 팩토리를 두면 “이 API 묶음 전부 리프레시”가 쉽다.

### 팩토리 위치

| 범위 | 파일 | 예 |
|------|------|-----|
| 앱 공통·인증 등 | `src/shared/api/query-keys.ts` | `cmsQueryKeys.auth.me()` |
| 기능 전용 | `features/<도메인>/api/*-query-keys.ts` | `dashboardQueryKeys` 패턴 참고 |

- **import:** `import { cmsQueryKeys } from '@/shared/api'` (또는 `@/shared/api/query-keys`).
- **신규:** 가능하면 `['cms', …]`로 시작해 `dashboardQueryKeys`의 `['cms','dashboard']`와 계열을 맞춘다.
- **레거시:** `['users','list']`처럼 `cms` 접두 없는 키가 코드베이스에 남아 있을 수 있다. **새 코드는 팩토리 + `cms` 접두**를 우선한다.

### `real-api-modules`와의 정렬

- `VITE_REAL_API_MODULES`의 모듈 키(예: `adminAuth`, 추후 `textbooks`)와 **같은 도메인 이름**을 query 키 트리에 쓰면, PR·문서에서 “어디 캐시가 이 API와 연결되는지” 찾기 쉽다. (강제 일치는 아니나 권장.)
- 뮤테이션 성공 후: **해당 도메인의 `…all()` 또는 구체 키**를 `invalidateQueries`해 서버와 맞춘다.

### `useQuery` 예시 (개념)

```ts
queryKey: programDetailKeys.volunteer(programId),
queryFn: () =>
  isRealApiModuleEnabled('programs')
    ? fetchProgramVolunteer(programId)
    : getProgramVolunteerFromMock(programId),
```

키는 `programId`만 반영하고, **mock/실 분기는 queryFn 내부**에 두면 전환 시 키 안정성이 유지된다 (응답 스키마가 동일할 때).

---

## fetcher·타입 패턴 (권장)

실 Swagger 계약이 `success` / `data` / `error` 래퍼인 경우:

1. **`features/<domain>/model/<name>-api.types.ts`** — 요청/응답 DTO.
2. **`features/<domain>/api/<name>-fetcher.ts`** — `apiClient.post/get` + 래퍼 검증 + 실패 시 전용 `Error` 클래스 throw.

참고: [admin-login-fetcher.ts](../../src/features/auth/api/admin-login-fetcher.ts), [admin-login-api.types.ts](../../src/features/auth/model/admin-login-api.types.ts)

---

## mock → 실 API 점진 전환

1. **`src/shared/config/real-api-modules.ts`** — `REAL_API_MODULE_KEYS`에 문자열 리터럴 추가, `isRealApiModuleEnabled('키')` export.
2. **서비스 레이어** (`entities/*/api`, `features/*/api`) — `if (isRealApiModuleEnabled('…')) return fetcher()` else mock.
3. **`.env.example`** — 새 모듈 키를 주석 예시에 추가(선택).

UI·페이지는 mock/실 분기를 두지 않는다.

---

## Vite 프록시 (`vite.config.ts`)

- `server.proxy['/api']` → `VITE_API_SERVER`(또는 동일 역할 변수) 오리진.
- ngrok 타깃이면 프록시가 `ngrok-skip-browser-warning` 헤더를 붙일 수 있음(코드 기준).

`.env` 변경 후 **`pnpm run cms` 재시작** 필요.

---

## 새 엔드포인트 체크리스트

- [ ] Swagger 경로와 동일한지 `api-paths`(또는 `config/api/*.ts`)에 상수·빌더 추가
- [ ] path param은 `encodeURIComponent` 처리
- [ ] 실 API로 켤 경우 `REAL_API_MODULE_KEYS` + `isRealApiModuleEnabled` + 서비스(또는 `queryFn`) 분기
- [ ] fetcher + 타입(래퍼 응답이면 Error 클래스)
- [ ] `@/shared/api`의 `apiClient` 사용
- [ ] **`useQuery` / `useInfiniteQuery`:** `queryKey`는 팩토리(`cmsQueryKeys` 또는 `features/.../api/*-query-keys.ts`)만 사용; mock·실이 같은 캐시를 쓰면 키 유지, 스키마가 다르면 키에 버전 구분
- [ ] **뮤테이션 후** `invalidateQueries` 범위가 API 도메인과 맞는지 확인 (`…all()` 등)
- [ ] `.env.example`에 필요한 env 주석 반영
- [ ] 로컬: 프록시 vs `VITE_API_BASE_URL` 직접 중 팀 정책에 맞게 선택 후 Network로 확인

---

## 장기 (선택)

- OpenAPI 스펙에서 **클라이언트 코드 생성**(`openapi-typescript`, Orval 등)하면 경로·타입 중복을 더 줄일 수 있음. 도입 시 이 문서의 “경로 단일 출처”는 생성물 + 얇은 래퍼로 조정.
- **Orval 운영 (대시보드 1차 적용됨):** [orval-codegen.md](./orval-codegen.md), [backend-handoff.md](./backend-handoff.md), [dashboard-api-integration.md](./dashboard-api-integration.md)

**Last updated:** 2026-06-12
