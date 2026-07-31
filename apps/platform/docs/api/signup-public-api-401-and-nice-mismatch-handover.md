# Handover: Platform 회원가입 공개 API 401 · NICE 불일치 오류 응답 요청

**대상:** 백엔드  
**앱:** Platform (사용자 홈페이지, `apps/platform`)  
**일시:** 2026-07-31  
**환경:** 로컬 Platform (`http://localhost:5173`) → ngrok 백엔드  
**우선순위:** 홈페이지 회원가입 E2E **전체 차단**

---

## 1. 요약

홈페이지 **회원가입은 로그인 전(무토큰) 플로우**입니다.  
아래 공개 API들이 Bearer 없이 호출하면 전부 **`401 UNAUTHORIZED`** 를 반환해, 약관·이메일 중복검사·학교 선택·가입 완료가 모두 실패합니다.

추가로, NICE 본인인증에서 **사전 입력(이름/성별/생년월일)과 NICE 입력값이 불일치**해도 서버/콜백에서 **프론트가 쓸 수 있는 에러가 내려오지 않아** 화면 안내가 어렵습니다.

---

## 2. 이슈 A — 회원가입 공개 API가 전부 401

### 2.1 기대

OpenAPI/플로우상 아래 API는 **PUBLIC** (로그인·Bearer 불필요)이어야 합니다.

| Method | Path | Platform 사용 시점 |
|--------|------|-------------------|
| `GET` | `/api/homepage/auth/signup/terms` | 회원유형·생년월일 확정 후 약관 원장 조회 |
| `GET` | `/api/homepage/auth/signup/email-availability` | 이메일 중복검사 |
| `GET` | `/api/homepage/organizations/schools` | 학교 선택 시 `organizationId` 매칭 |
| `POST` | `/api/homepage/auth/signup/general` | 일반회원 가입 완료 |
| `POST` | `/api/homepage/auth/signup/teacher` | 교사회원 가입 완료 (동일 권한 정책 필요) |

### 2.2 현재 실측 (Bearer 없음, 2026-07-31)

베이스: 로컬 Platform이 프록시하는 ngrok 백엔드

공통 응답 본문:

```json
{
  "success": false,
  "data": null,
  "message": "UNAUTHORIZED: authentication is required",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "authentication is required",
    "field": null,
    "traceId": "…"
  }
}
```

| 호출 | HTTP |
|------|------|
| `GET .../signup/terms?memberType=GENERAL&birthDate=1994-04-04` | **401** |
| `GET .../signup/email-availability?email=test@example.com` | **401** |
| `GET .../organizations/schools?keyword=test&page=0&size=3` | **401** |
| `POST .../signup/general` (body `{}`) | **401** |

### 2.3 프론트 영향

1. **약관 API 401** — 가입 POST용 `termsAgreements` 원장을 못 받음  
2. **이메일 중복검사 401** — 사용 가능 여부 확인 불가  
3. **schools 401** — 학교 선택 시 axios가 `401 + UNAUTHORIZED` + refresh 없음 → **로그인 화면으로 리다이렉트**  
   (가입 중 토큰이 없는 것이 정상인데, 공개 API 401을 세션 만료로 처리함)
4. **signup/general 401** — “가입 완료” 불가

### 2.4 백엔드 요청 (이슈 A)

1. 위 homepage signup / organizations/schools API를 **무인증 PUBLIC**으로 열어 주세요.  
2. 시큐리티 필터·게이트웨이·프로필(local/ngrok)에서 `/api/homepage/auth/signup/**`, `/api/homepage/organizations/schools` 가 막혀 있는지 확인해 주세요.  
3. 반영 후 **Bearer 없이 200(또는 정상 비즈니스 4xx)** 이 나오는지 확인해 주세요.  
   - email-availability: 사용 가능/불가 비즈니스 응답  
   - terms: 약관 카탈로그  
   - schools: 검색 결과(빈 목록이어도 200)  
   - signup/general: 인증 세션·검증 실패는 **401이 아닌** 비즈니스 에러 코드로

### 2.5 수용 기준 (이슈 A)

- [ ] 위 4개 API를 **Authorization 헤더 없이** 호출해도 `authentication is required` 401이 나지 않음  
- [ ] Platform 로컬에서 이메일 중복검사 → 학교 선택 → 가입 완료까지 401로 끊기지 않음  
- [ ] schools 401로 인한 **로그인 리다이렉트**가 사라짐

---

## 3. 이슈 B — NICE 본인인증 정보 불일치 시 에러 미전달

### 3.1 상황

회원가입 중 사용자가 **사전에 입력한 이름·성별·생년월일**과  
NICE 플랫폼에서 인증한 정보가 **상이**할 경우:

- 프론트는 실패를 사용자에게 안내해야 함  
- 현재 **서버에서 쓸 수 있는 에러(코드/메시지/콜백 파라미터)가 내려오지 않음**  
- 콜백·세션 조회만으로는 UI 분기(“정보가 일치하지 않습니다”)가 어려움

### 3.2 프론트 기대 동작

불일치 시 부모 창에 실패 메시지를 보여 주고, 본인인증 단계를 유지/재시도할 수 있어야 합니다.

### 3.3 백엔드 요청 (이슈 B)

다음 중 **하나 이상**으로 불일치를 명시해 주세요.

| 옵션 | 설명 |
|------|------|
| **B-1. 콜백 query** | `frontendReturnUrl` 리다이렉트 시 `error` / `errorCode` / `message` 등 (예: `IDENTITY_MISMATCH`, `EXPECTED_PROFILE_MISMATCH`) |
| **B-2. 세션 GET** | `GET .../identity/{sessionId}` (+ status token) 응답 `status`를 `FAILED`/`MISMATCH` 등으로 두고, `failureReason` 또는 `message` 포함 |
| **B-3. start 시 검증 실패면** | NICE 완료 전/후 서버 검증 실패를 **명확한 error.code + message** JSON으로 반환 |

권장 메시지 예:

```text
입력하신 이름·생년월일·성별이 본인인증 정보와 일치하지 않습니다.
```

### 3.4 수용 기준 (이슈 B)

- [ ] 사전 입력값과 NICE 인증 프로필 불일치 시, 프론트가 파싱 가능한 **에러 코드 또는 메시지**가 전달됨  
- [ ] 성공(VERIFIED)과 구분되는 status / error 로 UI 분기 가능  
- [ ] (가능하면) OpenAPI에 해당 실패 케이스 문서화

---

## 4. 재현 절차 (이슈 A)

1. Platform `http://localhost:5173` 회원가입 (로그인하지 않은 상태)  
2. 일반회원 · 생년월일 입력 → Network에 `signup/terms` **401**  
3. 이메일 중복검사 → `email-availability` **401**  
4. 본인인증 후 프로필에서 학교 검색·선택 → `organizations/schools` **401** → 로그인 화면 이동  
5. (401 우회해도) 가입 완료 → `signup/general` **401**

무토큰 curl 재현:

```bash
BASE=<ngrok-origin>

curl -sS -H 'Accept: application/json' \
  "$BASE/api/homepage/auth/signup/terms?memberType=GENERAL&birthDate=1994-04-04"

curl -sS -H 'Accept: application/json' \
  "$BASE/api/homepage/auth/signup/email-availability?email=test@example.com"

curl -sS -H 'Accept: application/json' \
  "$BASE/api/homepage/organizations/schools?keyword=test&page=0&size=3"

curl -sS -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -X POST -d '{}' "$BASE/api/homepage/auth/signup/general"
```

---

## 5. 관련 프론트 경로 (참고)

- 약관/이메일/가입: `apps/platform/src/features/auth/sign-up/api/`
- 학교 ID 매칭: `apps/platform/src/features/auth/sign-up/ui/school-search-modal/school-search-modal.tsx`
- 401 → 로그인 리다이렉트: `apps/platform/src/shared/api/axios-instance.ts` (`handleAuthFailure`)
- NICE 콜백: `packages/identity-verification/src/callback.ts`

---

## 6. 백엔드 회신 부탁

1. 이슈 A: PUBLIC 미적용이 **설정 누락**인지 **의도(별도 토큰 필요)** 인지  
2. 이슈 A 반영 환경·예정 시각  
3. 이슈 B: 불일치 시 사용할 **에러 코드·전달 채널**(콜백 query / 세션 status / JSON)  
4. teacher signup·보호자 플로우도 동일 PUBLIC 정책인지

회신 주시면 Platform에서 회원가입 E2E를 다시 검증하겠습니다.
