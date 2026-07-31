# 백엔드 API 인수인계 (CMS 프론트)

Swagger/OpenAPI 기반 실 API 연동 시 공통 설정·인증·응답 규칙을 정리합니다.

상세 클라이언트 규칙: [api-routes-and-client.md](./api-routes-and-client.md)  
Orval 코드 생성: [orval-codegen.md](./orval-codegen.md)  
대시보드 1차 파일럿: [dashboard-api-integration.md](./dashboard-api-integration.md)  
**템플릿 양식 (forms-surveys)**: [forms-surveys-api-integration.md](./forms-surveys-api-integration.md) · [PHASE별 마이그레이션](./forms-surveys-api-migration-guide.md) · [**백엔드 갭 목록**](./forms-surveys-api-backend-gaps.md) · [**신규 템플릿 생성 갭**](./template-create-api-backend-handoff.md)  
**일반 프로그램 (programs)**: [programs-api-integration.md](./programs-api-integration.md) · [**등록 플로우 API 목록**](./programs-registration-flow-api-backend-handoff.md) · [**등록 완료 POST 핸드오프**](./programs-create-api-backend-handoff.md) · [마이그레이션 가이드](./programs-api-migration-guide.md) · [백엔드 갭](./programs-api-backend-gaps.md) · [남은 작업](./programs-api-remaining-work.md) · [**상세 완료율 · Phase 5–10**](./programs-detail-api-conversion-status.md) · [**상세 LNB 미전환·CRUD 갭**](./programs-detail-lnb-crud-api-gaps.md)

**E2E 관측 수정 요청**: [**e2e-backend-fixes-index.md**](./e2e-backend-fixes-index.md) (`DATABASE_ERROR` · 회원 등록 path · MFA 동시성)

**API 에러 사용자 메시지 (CMS·Platform 공통)**: [backend-handoff §에러 응답](./backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통) · [Platform handoff](../../platform/docs/api/api-error-response-handoff-2026-07-31.md)

**회원 관리 (members)**: [members/README.md](./members/README.md) · [**백엔드 handoff**](./members/members-api-backend-handoff-2026-07-31.md) · [FE 연동 명세](./members/members-api-integration-2026-07-23.md)

**프로그램 유형별 전환**: [**UJAT 백엔드 핸드오프**](./programs-ujat-api-backend-handoff.md) · [**1사1교 백엔드 핸드오프**](./programs-company-school-api-backend-handoff.md) · [**1사1교 더미 시드**](./company-school-program-dummy-seed-backend-request.md) · [**일반 프로그램 더미 시드**](./general-program-dummy-seed-backend-request.md)

**테이블 일괄삭제 (CMS 전수)**: [**cms-table-bulk-delete-api-backend-handoff.md**](./cms-table-bulk-delete-api-backend-handoff.md) · **일괄승인**: [**cms-table-bulk-approve-api-backend-handoff.md**](./cms-table-bulk-approve-api-backend-handoff.md) · **일괄다운로드**: [**cms-table-bulk-download-api-backend-handoff.md**](./cms-table-bulk-download-api-backend-handoff.md)

---

## Swagger / OpenAPI

| 항목            | 값                                                                                |
| --------------- | --------------------------------------------------------------------------------- |
| Swagger UI      | `https://6920-221-146-247-18.ngrok-free.app///swagger-ui/index.html`              |
| OpenAPI JSON    | `https://6920-221-146-247-18.ngrok-free.app///v3/api-docs`                        |
| 프론트 스냅샷   | [`apps/cms/openapi/backend.openapi.json`](../../openapi/backend.openapi.json)     |
| 대시보드 subset | [`apps/cms/openapi/dashboard.openapi.json`](../../openapi/dashboard.openapi.json) |

백엔드 설명에 따르면 프론트 handoff용 계약은 `openapi_frontend_handoff.json`(백엔드 repo)에도 존재합니다. 스펙 drift 방지를 위해 백엔드팀과 주기적으로 동기화하세요.

---

## 로컬 개발 환경

1. [`apps/cms/.env.local.example`](../../.env.local.example) → `.env.local` 복사
2. **프록시 모드(권장)**

```env
VITE_API_SERVER=https://6920-221-146-247-18.ngrok-free.app//
VITE_REAL_API_MODULES=adminAuth,dashboard,logs,detailedPrograms,textbooks,sponsors,notices,faqs,inquiries,paymentOrders,accountPayments,settlementConfigs,programs,applications,programProgress
VITE_ADMIN_AUTH_API_PREFIX=/api/admin/auth
```

3. `pnpm run cms` **재시작** (Vite env·proxy 반영)
4. Network: `http://localhost:3000/api/...` → ngrok upstream

`VITE_API_BASE_URL`만 쓰면 브라우저가 백엔드를 직접 호출(CORS 필요). DevTools에 ngrok 호스트가 보여야 할 때만 사용.

---

## 인증

| API             | 경로                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------- |
| 관리자 로그인   | `POST /api/admin/auth/login`                                                                 |
| MFA 검증        | `POST /api/admin/auth/mfa/verify`                                                            |
| MFA TOTP 등록   | `POST /api/admin/auth/mfa/enrollment` (`mfaMethod`, `enabled`, `challengeUuid`·`totpSecret`) |
| 관리자 로그아웃 | `POST /api/admin/auth/logout` body: `{ refreshToken }` (Authorization 제외, 204)             |
| 관리자 refresh  | `POST /api/admin/auth/refresh` body: `{ refreshToken }` (Authorization 제외, flat 토큰 응답) |

Access 만료 시그널: `HTTP 401` + `error.code === "UNAUTHORIZED"` → axios silent refresh.  
Refresh 무효: `401` + `REFRESH_TOKEN_INVALID` → 로그인. `/api/auth/refresh`는 사용하지 않음.

**로그인 → MFA 흐름**

1. `POST /api/admin/auth/login` → `{ requiresMfa, challengeUuid, mfaMethod, expiresAt }` (래퍼 없음)
2. `mfaMethod` 분기:
   - `LOCAL_TEST_CODE`: QR 없음 — 테스트 코드 **`000000`** 입력
   - `TOTP`: `POST /api/admin/auth/mfa/enrollment`으로 시크릿 등록 후 QR 표시 → Authenticator 6자리 입력
3. `POST /api/admin/auth/mfa/verify` body: `{ challengeUuid, verificationCode }`
4. 성공 시 `{ accessToken, refreshToken, expiresInSeconds }` → `auth_token` / `auth_refresh_token` 저장

**TOTP 최초 등록 (`mfa/enrollment`)**

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

## 일반 프로그램 (`programs` / `applications` / `programProgress`)

상세 SSOT: [programs-api-integration.md](./programs-api-integration.md) · 갭: [programs-api-backend-gaps.md](./programs-api-backend-gaps.md) · 남은 작업: [programs-api-remaining-work.md](./programs-api-remaining-work.md)

| 모듈          | env 키                           | 주요 경로                                   |
| ------------- | -------------------------------- | ------------------------------------------- | ----------- | ------------ |
| 프로그램 CRUD | `programs`                       | `GET/POST/PATCH/DELETE /api/admin/programs` |
| 신청          | `applications` (+ `programs`)    | `.../applications/organizations             | instructors | individuals` |
| 진행현황      | `programProgress` (+ `programs`) | `.../progress/participants` 등              |

**목록 query enum (프론트 매핑)**

| CMS URL `status` | API `periodStatus` |
| ---------------- | ------------------ |
| `scheduled`      | `RECRUITING`       |
| `in_progress`    | `IN_PROGRESS`      |
| `completed`      | `COMPLETED`        |

고정: 목록 query `programType=GENERAL`. Create body에도 `programType: "GENERAL"` 전송 (`mapGeneralProgramToCreateRequest`).

**Create/Update 1차 전송 필드**: `sponsorId`, `title`, `mainTitle`, `type`, `format`, `category`, `description`, 일정·상태·교육·모집·연락·`rounds[]` 등 — 어댑터 [`general-program-adapters.ts`](../../src/features/program/general/api/adapters/general-program-adapters.ts). CMS 전용 nested(`generalCommonInfo` 등)는 1차 omit.

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
VITE_API_SERVER=https://6920-221-146-247-18.ngrok-free.app//
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

## 에러 응답 — 사용자 노출 메시지 (P0 · CMS · Platform 공통)

**우선순위:** P0  
**대상:** JaKorea **백엔드 API 전체** (CMS ` /api/admin/*` · Platform `/api/homepage/*` · legacy `/api/users/*` 등)

### 배경

CMS·Platform FE는 API 실패 시 서버가 내려준 **`message` 문자열을 가공·번역 없이** alert·모달·폼 에러 영역에 **그대로 노출**합니다.

| 앱 | 대표 FE 경로 | 노출 방식 |
|----|--------------|-----------|
| **CMS** | `features/user/detail/lib/use-personal-info-reveal.ts` | `cmsAlertModal` 「열람 실패」 본문 = `error.message` |
| **CMS** | `features/user/api/get-member-api-error.ts` · `features/*/api/get-*-api-error.ts` | axios `response.data.message` / `error.message` |
| **CMS** | `shared/utils/error-handler.ts` | 일부 화면은 타입별 fallback만, **API message 우선** |
| **Platform** | `features/auth/sign-up/lib/helpers/get-signup-api-error-message.ts` | 회원가입·검색 모달 등 `message` 직접 표시 |

→ BE validation·내부 오류 문구가 **최종 사용자 UI**에 그대로 보입니다.

### 관측 예 (2026-07-31 · CMS unmask)

| HTTP | 현재 BE `message` (UI 그대로) | 문제 |
|------|-------------------------------|------|
| 400 | `reason 크기가 5에서 500 사이여야 합니다` | Bean Validation **필드명·제약 리터럴** 노출 |

### BE 요청 (전 API 공통)

1. **`error.message`** (래퍼 `{ success: false, error: { code, message } }`) 또는 동급 top-level **`message`** 에 **한국어 사용자 안내 문구**만 넣을 것.
2. **금지** — 아래 형태는 UI에 그대로 노출되므로 **사용하지 말 것**:
   - Bean Validation 기본 문구 (`{field} 크기가 …`, `must not be null`, `Size`, `NotBlank` 등)
   - 영문 개발자 메시지 (`unexpected server error`, `DATABASE_ERROR` 단독 등)
   - Java 필드 path·스키마 키 그대로 (`reason`, `termsAgreements[0].termsType`)
3. **권장** — `error.code`는 **기계 판별용**(예: `VALIDATION_ERROR`, `UNAUTHORIZED`) · `error.message`는 **사람이 읽을 문구**.
4. **validation 매핑 예**

| 상황 | `error.code` (예) | `error.message` (UI 노출 OK) |
|------|-------------------|------------------------------|
| unmask reason 빈값 | `VALIDATION_ERROR` | `열람 사유를 입력해 주세요.` |
| unmask reason 500자 초과 | `VALIDATION_ERROR` | `열람 사유는 500자 이내로 입력해 주세요.` |
| 권한 없음 | `FORBIDDEN` | `접근 권한이 없습니다.` |
| 서버 내부 오류 | `INTERNAL_ERROR` | `일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.` |

5. **OpenAPI** — 4xx/5xx response schema에 `message` **사용자 문구 예시** 기재 (필드명·제약 설명 X).
6. **Platform 회원가입·NICE** 등 공개 API도 **동일 정책** — [Platform handoff](../../platform/docs/api/api-error-response-handoff-2026-07-31.md)

### 수락 기준

- [ ] validation 400 — FE alert에 **필드명·minLength/maxLength 리터럴 미노출**
- [ ] CMS unmask reason 1글자 — § [members handoff §2.7](./members/members-api-backend-handoff-2026-07-31.md#27-unmask-reason-길이-제한-p0--2026-07-31-관측)
- [ ] Platform 회원가입 401/400 — [signup handover](../../platform/docs/api/signup-public-api-401-and-nice-mismatch-handover.md) 재현 시 사용자 문구

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

**Last updated:** 2026-07-31 (에러 사용자 메시지 P0 · members handoff 링크)
