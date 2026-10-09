# Cursor prompt — Platform 이메일 찾기 · NICE `nice/start`가 `INVALID_CREDENTIALS`(로그인 문구)로 실패 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/find-email-nice-start-invalid-credentials-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **BE 요청 대기** |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P0** (Platform 이메일 찾기 본인인증 시작 차단) |
| 화면 | Platform `http://localhost:5173/auth/find-email` |
| API | `POST /api/auth/verification-sessions/identity/nice/start` |

---

## 1. 한 줄 요약

이메일 찾기에서 NICE 본인인증을 시작하면 `nice/start`가 **401 + `INVALID_CREDENTIALS`** 로 실패하고,  
클라이언트 메시지가 **「이메일 또는 비밀번호를 확인해 주세요.」**(로그인 문구)로 마스킹된다.  
원인은 FE 요청 shape 버그가 아니라 **(A) local `.env`가 `JA_IDENTITY_MODE=NICE_HTTP`라 실 NICE 호출이 실패**하고,  
**(B) 본인인증 실패를 로그인용 `INVALID_CREDENTIALS`로 내려 메시지가 오인**되며,  
**(C) `flow=FIND_EMAIL`이 `normalizeFlow`에서 `ADMIN_SIGNUP`으로 흡수**되는 점이다.

---

## 2. FE 관측 (재현 · 2026-10-09)

### 2.1 요청

```http
POST /api/auth/verification-sessions/identity/nice/start
Content-Type: application/json
```

```json
{
  "provider": "NICE",
  "flow": "FIND_EMAIL",
  "frontendReturnUrl": "http://localhost:5173/auth/find-email/identity/callback",
  "state": "<uuid>"
}
```

Vite proxy: `/api/auth` → JABACK `8080` (라우팅 OK).  
동일 body로 `curl http://localhost:8080/...`도 동일 실패 → **프록시/FE 아님**.

### 2.2 응답 (클라이언트)

```json
{
  "success": false,
  "data": null,
  "message": "이메일 또는 비밀번호를 확인해 주세요.",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호를 확인해 주세요.",
    "field": null,
    "traceId": "<traceId>",
    "details": null
  }
}
```

HTTP status: **401**.

### 2.3 DB 관측

`identity_verification_session`에 **PENDING 행은 INSERT됨** (`provider=NICE`, `nice_*` 컬럼 전부 null).  
→ `createPendingNiceSession`까지는 성공, 이후 **실 NICE token/authUrl 발급(또는 finalize) 단계에서 실패**.

수동으로 같은 행에 local finalize UPDATE는 성공 → SQL/스키마 문제는 아님.

### 2.4 로컬 설정 (원인 A)

JABACK `.env` (로컬 기동 시 로드):

| 키 | 관측 값 | 비고 |
|----|---------|------|
| `SPRING_PROFILES_ACTIVE` | `local` | |
| `JA_IDENTITY_MODE` | **`NICE_HTTP`** | `LOCAL_IDENTITY`가 아님 |
| `JA_NICE_RETURN_URL` | ngrok HTTPS return | local mock 경로가 아님 |

`NiceVerificationStartService.localIdentityMode()`는 **`LOCAL_IDENTITY`일 때만** stub authUrl을 만든다.  
`NICE_HTTP`면 `NiceIdentityClient.issueToken` / `issueAuthUrl`을 호출하고, 실패 시 `AuthException(INVALID_CREDENTIALS, …)`.

`ClientErrorMessageResolver`는 `INVALID_CREDENTIALS`를 항상  
「이메일 또는 비밀번호를 확인해 주세요.」로 치환한다 → **본인인증 실패가 로그인 실패처럼 보임**.

---

## 3. 요청 사항

### 3.1 P0 — 로컬에서 `nice/start` 성공 경로 확보

둘 중 하나를 **명시적으로** 지원·문서화하라.

**옵션 L (권장 · 로컬 기본):**  
`JA_IDENTITY_MODE=LOCAL_IDENTITY` (또는 local profile 기본값 유지)로  
`POST …/nice/start`가 외부 NICE HTTP 없이 `authUrl`(local return)을 반환.

**옵션 N:**  
`NICE_HTTP`를 유지할 경우, local에서 실제로 통과하는  
`JA_NICE_CLIENT_ID` / `SECRET` / `JA_NICE_RETURN_URL`(도달 가능) 구성을 검증하고  
실패 시 **내부 사유가 로그에 남고**, 클라이언트에는 로그인 문구가 아닌 본인인증용 코드를 내려라.

수용:

- [ ] Platform `5173` 이메일 찾기 → `nice/start` **200** + `sessionId` + `authUrl`
- [ ] `flow`/`frontendReturnUrl`에 `FIND_EMAIL` + `…/auth/find-email/identity/callback` 허용
- [ ] 실패 시 화면에 「이메일 또는 비밀번호…」가 **나오지 않음**

### 3.2 P0 — 본인인증 실패 에러 코드/메시지 분리

`nice/start`·NICE provider 실패에 **로그인용 `INVALID_CREDENTIALS`를 쓰지 마라.**

권장 예:

| 상황 | code | 클라이언트 메시지 (예) |
|------|------|------------------------|
| NICE HTTP/자격 실패 | `IDENTITY_PROVIDER_UNAVAILABLE` 또는 `IDENTITY_START_FAILED` | 본인인증을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요. |
| returnUrl/allowlist | 기존 `UNAUTHORIZED` / `SECURITY_COMPONENT_NOT_CONFIGURED` | 유지 |

`ClientErrorMessageResolver`에 위 코드를 등록하고,  
`AuthExceptionHandler` 로그에는 **내부 `ex.getMessage()`** 도 남겨 디버깅 가능하게 하라  
(현재는 resolved client message만 로그되어 원인 추적이 어렵다).

### 3.3 P1 — `flow=FIND_EMAIL` (및 `FIND_PASSWORD`) 정규화

`NiceIdentityProperties.normalizeFlow` 현황:

- `MEMBER_SIGNUP` / guardian aliases만 인식
- 그 외( **`FIND_EMAIL` 포함** ) → **`ADMIN_SIGNUP`**

Platform은 `flow: "FIND_EMAIL"` + dynamic `frontendReturnUrl`을 보낸다.  
origin allowlist만 통과하면 redirect URL은 맞지만, 세션에 저장되는 `nice_flow`가 `ADMIN_SIGNUP`이라 감사·콜백 검증이 어긋날 수 있다.

요청:

- [ ] `FIND_EMAIL`, `FIND_PASSWORD`(및 사용 중이면 `ADMIN_PROVISIONED` 등)를 **1급 flow**로 유지
- [ ] `normalizeFlow("FIND_EMAIL") === "FIND_EMAIL"`
- [ ] 미설정 configured return URL이 없어도 **요청 body `frontendReturnUrl` + allowlist**면 start 가능 (현행 resolveFrontendReturnUrl과 동일)

### 3.4 (참고) FE 측

- 요청 path/body/proxy는 계약과 일치 (`packages/identity-verification`, `findEmailIdentityVerificationClient`)
- invent로 NICE를 우회하지 않음
- 로그인 문구 오인은 FE에서도 identity start에 대해 본인인증용 fallback을 쓰도록 보강 가능하나, **근본 수정은 BE 코드/에러 매핑**

---

## 4. 관련 코드 (BE)

- `NiceVerificationStartService.startIdentityAuthentication`
- `NiceIdentityProperties.normalizeFlow` / `resolveFrontendReturnUrl`
- `NiceIdentityClient.issueToken` / `issueAuthUrl`
- `ClientErrorMessageResolver` → `INVALID_CREDENTIALS`
- `AuthPublicEndpointMatcher` — `…/nice/start`는 public (인증 불필요) ✅

---

## 5. QA

1. JABACK 재기동 후  
   `POST …/nice/start` with `flow=FIND_EMAIL`,  
   `frontendReturnUrl=http://localhost:5173/auth/find-email/identity/callback`
2. 기대: **200**, `data.authUrl`, `data.sessionId`, `data.flow`가 `FIND_EMAIL`(또는 문서화된 동등 값)
3. Platform `/auth/find-email` → 본인인증 시작 → 로그인 문구 없음 → local/NICE 창 진행
4. DB: 해당 session에 `nice_flow` / `nice_frontend_return_url` non-null

### BE 완료 후 FE handoff

1. 선택 옵션(L/N)과 local `.env` 권장 값 (`JA_IDENTITY_MODE=…`)
2. 새 error code 목록
3. `FIND_EMAIL` flow 지원 여부
