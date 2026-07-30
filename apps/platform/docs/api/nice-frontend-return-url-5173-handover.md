# Handover: Platform NICE 본인인증 — `localhost:5173` frontendReturnUrl allowlist 요청

**대상:** 백엔드  
**앱:** Platform (사용자 홈페이지, `apps/platform`)  
**일시:** 2026-07-30  
**우선순위:** 로컬 본인인증·회원가입 E2E 차단  
**관련 오류:**

```text
frontendReturnUrl origin is not allowed for NICE return redirect.
```

---

## 1. 요약 (요청 한 줄)

로컬 Platform 개발 포트가 **`http://localhost:5173`** 입니다.  
NICE 본인인증 start 시 전달하는 `frontendReturnUrl` origin으로 **5173을 allowlist에 추가**해 주세요.  
CMS용 **`http://localhost:3000`은 유지**해 주세요.

---

## 2. 배경

| 앱 | 로컬 포트 | 용도 |
|-----|-----------|------|
| CMS (`apps/cms`) | **3000** | 관리자 |
| Platform (`apps/platform`) | **5173** | 사용자 홈페이지 |

- 일시적으로 Platform도 NICE 검증을 위해 **3000**을 썼으나, CMS와 포트가 겹쳐 **다시 5173으로 복구**했습니다.
- 현재 nice/start 요청의 `frontendReturnUrl`은 브라우저 origin 기준이라 **`http://localhost:5173/...`** 로 나갑니다.
- 백엔드 allowlist에 5173이 없으면 위 오류로 **본인인증 시작 단계에서 실패**합니다.

---

## 3. 프론트가 보내는 값

### 3.1 API

- 본인인증 시작: NICE identity start (홈페이지 회원가입 flow `MEMBER_SIGNUP`)
- 요청 필드: `frontendReturnUrl`

### 3.2 실제 URL (로컬 Platform)

프론트는 `window.location.origin + callbackPath`로 생성합니다.

| 플로우 | `frontendReturnUrl` |
|--------|---------------------|
| 일반/교사 본인인증 | `http://localhost:5173/auth/sign-up/identity/callback` |
| 만 14세 미만 보호자 본인인증 | `http://localhost:5173/auth/sign-up/guardian-identity/callback` |

관련 코드:

- `apps/platform/src/features/auth/identity-verification/signup-client.ts`
- `apps/platform/src/features/auth/identity-verification/guardian-client.ts`
- `packages/identity-verification` (`frontendReturnUrl: state.buildCallbackUrl()`)

### 3.3 참고 (프론트 env)

- Platform `.env`: `VITE_OAUTH_REDIRECT_ORIGIN=http://localhost:5173`
- Vite: `server.port = 5173`
- 현재 identity 클라이언트는 콜백 URL에 **실제 브라우저 origin**을 사용합니다. allowlist는 **5173 origin** 기준으로 맞춰 주시면 됩니다.

---

## 4. 백엔드 요청 사항

### 필수

1. NICE / identity **`frontendReturnUrl` allowlist**에 아래를 추가해 주세요.

   - Origin: `http://localhost:5173`
   - path까지 exact match인 경우 아래 둘 다:
     - `http://localhost:5173/auth/sign-up/identity/callback`
     - `http://localhost:5173/auth/sign-up/guardian-identity/callback`

2. 기존 CMS 로컬용 항목은 **삭제하지 말고 유지**해 주세요.

   - `http://localhost:3000` (및 기존 CMS identity callback path)

3. 로컬/ngrok 등 **프론트 로컬 개발이 붙는 백엔드 환경**에 반영해 주세요.  
   (스테이징·운영 정책은 기존대로 유지하되, 로컬 개발 환경에 5173이 빠져 있으면 됩니다.)

### 선택 (있으면 좋음)

- allowlist가 **origin 단위**인지 **full URL exact**인지 문서/회신에 명시
- 거절 시 응답 코드·메시지 형식 확인 (현재: `frontendReturnUrl origin is not allowed for NICE return redirect.`)

---

## 5. 재현

1. Platform `pnpm dev` → `http://localhost:5173`
2. 회원가입 → 휴대폰 본인인증 시작
3. nice/start 요청 body에  
   `frontendReturnUrl: "http://localhost:5173/auth/sign-up/identity/callback"`
4. **현재:** allowlist 미등록 시 오류로 실패  
5. **기대:** start 성공 → NICE 인증창 → 5173 callback으로 복귀

---

## 6. 수용 기준 (Definition of Done)

- [ ] `http://localhost:5173` (또는 위 callback URL)이 allowlist에 등록됨
- [ ] Platform 로컬에서 nice/start가 200(또는 성공 응답)으로 `authUrl` 반환
- [ ] NICE 인증 완료 후 `.../identity/callback`으로 리다이렉트 가능
- [ ] CMS `localhost:3000` NICE 흐름은 기존과 동일하게 동작

---

## 7. 백엔드 회신 부탁

1. allowlist 반영 환경 (로컬 / ngrok / staging 등)
2. 매칭 방식 (origin only / full URL)
3. 반영 완료 시각 또는 커밋/설정 키 이름 (가능하면)

회신 주시면 Platform에서 본인인증 E2E를 다시 검증하겠습니다.
