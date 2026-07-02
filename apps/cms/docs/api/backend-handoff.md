# 백엔드 API 인수인계 (CMS 프론트)

Swagger/OpenAPI 기반 실 API 연동 시 공통 설정·인증·응답 규칙을 정리합니다.

상세 클라이언트 규칙: [api-routes-and-client.md](./api-routes-and-client.md)  
Orval 코드 생성: [orval-codegen.md](./orval-codegen.md)  
대시보드 1차 파일럿: [dashboard-api-integration.md](./dashboard-api-integration.md)

---

## Swagger / OpenAPI

| 항목            | 값                                                                                |
| --------------- | --------------------------------------------------------------------------------- |
| Swagger UI      | `https://7836-183-102-114-192.ngrok-free.app//swagger-ui/index.html`               |
| OpenAPI JSON    | `https://7836-183-102-114-192.ngrok-free.app//v3/api-docs`                         |
| 프론트 스냅샷   | [`apps/cms/openapi/backend.openapi.json`](../../openapi/backend.openapi.json)     |
| 대시보드 subset | [`apps/cms/openapi/dashboard.openapi.json`](../../openapi/dashboard.openapi.json) |

백엔드 설명에 따르면 프론트 handoff용 계약은 `openapi_frontend_handoff.json`(백엔드 repo)에도 존재합니다. 스펙 drift 방지를 위해 백엔드팀과 주기적으로 동기화하세요.

---

## 로컬 개발 환경

1. [`apps/cms/.env.local.example`](../../.env.local.example) → `.env.local` 복사
2. **프록시 모드(권장)**

```env
VITE_API_SERVER=https://7836-183-102-114-192.ngrok-free.app/
VITE_REAL_API_MODULES=adminAuth,dashboard,logs,detailedPrograms,textbooks,sponsors,notices,faqs,inquiries,paymentOrders,accountPayments,settlementConfigs
VITE_ADMIN_AUTH_API_PREFIX=/api/admin/auth
VITE_AUTH_REFRESH_PATH=/api/auth/refresh
```

3. `pnpm run cms` **재시작** (Vite env·proxy 반영)
4. Network: `http://localhost:3000/api/...` → ngrok upstream

`VITE_API_BASE_URL`만 쓰면 브라우저가 백엔드를 직접 호출(CORS 필요). DevTools에 ngrok 호스트가 보여야 할 때만 사용.

---

## 인증

| API             | 경로                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| 관리자 로그인   | `POST /api/admin/auth/login`                                              |
| MFA 검증        | `POST /api/admin/auth/mfa/verify`                                         |
| MFA TOTP 등록   | `POST /api/admin/auth/mfa/setup` (`mfaMethod`, `enabled`, `challengeUuid`·`totpSecret`) |
| 관리자 로그아웃 | `POST /api/admin/auth/logout` body: `{ refreshToken }` (Bearer + refresh) |
| 관리자 refresh  | `POST /api/admin/auth/refresh` (`adminAuth` 활성 시 axios가 자동 사용)    |

**로그인 → MFA 흐름**

1. `POST /api/admin/auth/login` → `{ requiresMfa, challengeUuid, mfaMethod, expiresAt }` (래퍼 없음)
2. `mfaMethod` 분기:
   - `LOCAL_TEST_CODE`: QR 없음 — 테스트 코드 **`000000`** 입력
   - `TOTP`: `POST /api/admin/auth/mfa/setup`으로 시크릿 등록 후 QR 표시 → Authenticator 6자리 입력
3. `POST /api/admin/auth/mfa/verify` body: `{ challengeUuid, verificationCode }`
4. 성공 시 `{ accessToken, refreshToken, expiresInSeconds }` → `auth_token` / `auth_refresh_token` 저장

**TOTP 최초 등록 (`mfa/setup`)**

- 로그인 직후 challenge가 있을 때 `challengeUuid`를 body에 포함해 호출합니다.
- `totpSecret` 없이 호출하면 서버가 시크릿을 생성할 수 있고, 실패 시 프론트가 시크릿을 생성해 재전송합니다.
- OpenAPI `AdminMfaSetupResponse`에는 QR 필드가 없어, 프론트는 `totpSecret`/`otpauthUri`가 오면 사용하고 없으면 로컬에서 QR 이미지를 생성합니다.

**로컬 백엔드 (`mfaMethod: LOCAL_TEST_CODE`)**

- 테스트 코드: **`000000`** (Swagger 예시와 동일)
- Mock TOTP·QR 코드는 **API 로그인** 경로에서 사용하지 않음 — 반드시 **「API 로그인」** 버튼 사용
- `000000` 입력 후 `409 CONFLICT: app.auth.jwt.secret must be configured...` 가 나오면 **MFA는 통과했으나 백엔드 JWT secret 미설정** — 백엔드팀에 `app.auth.jwt.secret`(32자 이상) 설정 요청

CMS는 `useAuthStore` 토큰 → [`axios-instance.ts`](../../src/shared/instance/axios-instance.ts) Bearer 자동 부착.

**관리자 prefix 기본값:** [`api-paths.ts`](../../src/shared/config/api-paths.ts) → `/api/admin/auth`

---

## 관리자 소셜 로그인 / 계정 연결 (`socialAuth`)

공유 패키지: [`packages/social-auth`](../../../../packages/social-auth)  
CMS wiring: [`features/auth/social-auth/cms-client.ts`](../../src/features/auth/social-auth/cms-client.ts)

| API                    | 경로                                           | 용도                                                                                                |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| SSO 시작               | `POST /api/admin/auth/sso/login`               | 관리자 소셜 **로그인·연결** OAuth 시작 (`redirectUri`=백엔드 callback, `returnUrl`=프론트 complete) |
| SSO provider callback  | `GET /api/admin/auth/sso/{provider}/callback`  | IdP → 백엔드 code 교환 (브라우저 redirect, 프론트 XHR 아님)                                         |
| 로그인 session consume | `POST /api/auth/sso/login/sessions/consume`    | `socialLoginSessionId` → JWT                                                                        |
| 연결 목록              | `GET /api/admin/me/sso/accounts`               | 로그인 후 연결 목록 (`content[]`)                                                                   |
| 계정 연결              | `POST /api/admin/me/sso/accounts`              | mock/pending flush 시 `accessToken` + consent                                                       |
| 연결 해제              | `DELETE /api/admin/me/sso/accounts/{provider}` | 연결 해제                                                                                           |

> legacy `POST /api/admin/auth/sso/callback` 는 Swagger에서 제거됨. canonical은 backend redirect + session consume.

### 관리자 소셜 로그인 (Admin SSO)

1. 로그인 버튼 → `startLogin({ intent: 'login' })` → `POST /api/admin/auth/sso/login`
2. IdP → **백엔드** `GET /api/admin/auth/sso/{provider}/callback`
3. 백엔드 → 프론트 `/login/social/complete?socialLoginSessionId=...`
4. `processSocialLoginSessionReturn` → `POST /api/auth/sso/login/sessions/consume` → JWT 저장

- IdP Redirect URI: `{VITE_API_SERVER}/api/admin/auth/sso/{kakao\|naver\|google}/callback`
- mock 모드: 기존 `{origin}/oauth/{provider}` 프론트 콜백 유지

### 관리자 SSO 계정 연결 (내 정보 / 가입 wizard)

1. 연결 버튼 → `startLogin({ intent: 'link' })` → `POST /api/admin/auth/sso/login` (`returnUrl`=`/register/social-connect/callback`)
2. IdP → **백엔드** callback → 프론트 returnUrl (`linked`, `provider` query)
3. `processAdminSsoLinkReturn` → 연결 상태 반영
4. mock: 기존 `/oauth/{provider}` + pending link + `flushSocialPendingLinks()` 유지

- POST body (`SocialLinkRequest`): `provider`, `accessToken`, `socialConsentVersion`, `socialConsentAgreed`
- 연결 목록/해제: Bearer 필요

**환경 변수**

```env
VITE_API_SERVER=https://7836-183-102-114-192.ngrok-free.app/
VITE_KAKAO_CLIENT_ID=
VITE_NAVER_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_REAL_API_MODULES=...,socialAuth
# IdP Redirect URI: {VITE_API_SERVER}/api/admin/auth/sso/kakao|naver|google/callback
```

- `socialAuth` 모듈 하나로 Admin SSO **로그인·연결·목록** 실 API 활성화 (`socialAuthLogin` 별도 지정 가능)
- `CLIENT_SECRET`은 프론트에 두지 않음 (서버 OAuth 사용)

---

## mock → 실 API 전환

[`real-api-modules.ts`](../../src/shared/config/real-api-modules.ts):

- `VITE_REAL_API_MODULES` **미설정·빈 값** → 백엔드 URL이 있어도 **전부 mock**
- 예: `adminAuth,dashboard` → 나열된 모듈만 실 HTTP

UI·페이지는 분기하지 않습니다. **서비스 레이어**(`entities/*/api`, `features/*/api`)에서만 `isRealApiModuleEnabled('키')` 사용.

---

## 응답 형태

- 많은 API: `{ success, data, error?, message? }` 래퍼
- 일부 GET(대시보드 home 등): 200 body가 DTO 직접
- fetcher/adapter에서 래퍼 여부를 검증하고 UI 타입으로 매핑

실패 시 axios 인터셉터·fetcher Error 클래스로 UI 분기.

---

## 운영/QA 보조 API (Bearer 필요)

| API                                         | 용도                 |
| ------------------------------------------- | -------------------- |
| `GET /api/system/frontend-integration-pack` | 프론트 연동 pack     |
| `GET /api/system/screen-api-readiness`      | 화면별 API readiness |

Swagger Authorize에 관리자 토큰 입력 후 호출.

---

## ngrok URL 변경 시

1. `.env.local`의 `VITE_API_SERVER` 갱신
2. `pnpm --filter cms fetch:openapi` (또는 curl로 `openapi/backend.openapi.json` 재수집)
3. `pnpm --filter cms generate:api`
4. dev 서버 재시작

**Last updated:** 2026-06-22
