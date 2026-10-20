# 미성년(만 14세 미만) 일반회원 가입 — Guardian Bridge FE 연동

**출처:** BE 인수인계 `미성년.md` (2026-10-14, JABACK `3,4` 미커밋 기준)  
**앱:** Platform (`apps/platform`)  
**상태:** BE 로컬 검증 완료 · 브리지 플래그 기본 OFF · **FE Guardian Bridge + 최종 동의 challenge 연동 (2026-10-21)**

OpenAPI·DTO는 BE에서 **`openapi/backend.openapi.json`** 최신본을 받아 이 문서와 대조할 것.

---

## 1. 왜 400이 났는지 (기존 FE vs 신규 BE)

| 구분 | 기존 Platform FE | 신규 BE 기대 |
| --- | --- | --- |
| 보호자 NICE | `POST .../identity/nice/start` + `flow: MEMBER_SIGNUP` | **Guardian 전용** `POST .../guardian/{id}/nice/start` |
| `guardianVerificationSessionId` | NICE **Identity** `sessionId`를 그대로 저장 | **Guardian Challenge** `sessionId` (5-3)만 전달 |
| 가입 전제 | 약관 체크 + NICE 1회 | **Intent → Challenge → 최초 consent → NICE → status → final-consent-challenge → 최종 consent → signup** |
| 최종 body | `member` only | **`member.signupIntentId`** + Guardian session id |

**절대 금지:** `guardianVerificationSessionId = identitySessionId` (NICE start 응답 sessionId).

---

## 2. API 호출 순서 (FE)

1. `GET /api/portal/auth/signup/terms?memberType=GENERAL&birthDate=` — `GUARDIAN_CONSENT.version` 확보 (기존 `useSignupTermsQuery` 재사용 가능)
2. `POST /api/portal/auth/signup/intents` — `{ memberType, birthDate, gender }` → **`intentId`** (TTL 30분, gender enum은 OpenAPI 확인 — Intent는 `FEMALE` 예시)
3. `POST /api/auth/verification-sessions/guardian` — `signupIntentId`, `guardianName`, `guardianPhone`, `guardianRelation` → **`sessionId`(Guardian)**, **`statusToken`**
4. `POST .../guardian/{guardianSessionId}/consent` + header `X-Verification-Status-Token` — 최초 동의(`finalConsentToken` 없음) → **`status: PENDING`** 정상
5. `GET .../signup-status` — 이미 `identityVerified` 또는 `CONSENTED`면 NICE start를 다시 치지 않음
6. `POST .../guardian/{guardianSessionId}/nice/start` + status token + `Idempotency-Key: guardian-nice-{guardianSessionId}` — → **`sessionId`(Identity)**, `authUrl`, `flow: GUARDIAN_SIGNUP`
7. NICE return → 서버 callback; FE는 **`GET .../guardian/{guardianSessionId}/signup-status`** 로 판단. 콜백에서는 consent를 호출하지 않음
8. `identityVerified=true` & `status=PENDING` → `POST .../final-consent-challenge` → `challengeToken`을 **`finalConsentToken`**으로 최종 consent에 포함 → **`CONSENTED`**
9. `status=CONSENTED`면 최종 consent POST를 생략하고 가입 단계로 진행
10. `POST /api/portal/auth/signup/general` — `member.signupIntentId`, `member.guardianVerificationSessionId`(Guardian id), 아동 `name`/`birthDate`, **아동 `identityVerificationSessionId` 없음**

### 약관 (BE 확인)

- 필수: `SERVICE_TERMS`, `CHILD_PRIVACY_COLLECTION`, `GUARDIAN_CONSENT`
- `GUARDIAN_CONSENT`: **filledDocument 불필요**
- `PORTRAIT_RIGHTS`: 선택, `agreed: false` 허용

### 오류 (요약)

| HTTP | FE 처리 |
| --- | --- |
| 400 `SIGNUP_INVALID_REQUEST` | 매핑·ID 타입 점검, 무한 재시도 금지 |
| 401 | status token / 세션 무효 — 보호자 프로필부터 재시작. 로그인 `INVALID_CREDENTIALS` 문구 노출 금지 |
| 409 | POST 재시도 금지. `GET signup-status` 후 `CONSENTED`면 다음 단계, `identityVerified`면 challenge만 |
| 410 | 세션/challenge 만료 — Intent·Challenge부터 재시작 |
| 503 `GUARDIAN_SIGNUP_BRIDGE_NOT_ENABLED_PENDING_SECURITY_APPROVAL` | **공용 NICE 우회 금지**, 안내 문구 |

---

## 3. FE 상태 모델 (권장)

```text
CHILD_INPUT → INTENT_ISSUED → GUARDIAN_CHALLENGE → FIRST_CONSENT (PENDING)
→ NICE_STARTED (identitySessionId 별도) → NICE_RETURNED
→ signup-status → NEEDS_FINAL_CONSENT (verified+PENDING) → CONSENTED → SIGNUP
```

- callback query만으로 `CONSENTED` 처리 금지
- `statusToken`을 URL·analytics·console에 남기지 않음

---

## 4. 현재 jakorea FE (2026-10-21)

- Intent / Guardian / NICE start / signup-status / **final-consent-challenge** client 연동
- `guardianVerificationSessionId`는 Guardian Challenge id. Identity sessionId와 분리
- NICE 성공 후 별도 재동의 화면 없이 `final-consent-challenge` → 최종 consent 자동 제출
- 중복 NICE/consent POST는 `GET signup-status` + 409 재조회로 차단
- 성인 전환·생년 변경 시 Guardian sessionStorage를 정리

deprecated `guardian-client.ts`(`flow: MEMBER_SIGNUP`)는 화면에서 사용하지 않는다.

---

## 5. 화면·정책 (FE 단독 확정 불가)

- Guardian Challenge **전** `guardianName` / `guardianPhone` / `guardianRelation` 수집 순서 (현재: 관계는 NICE **후** step 4)
- NICE **후** 법정대리인 **동의 재확인** UI·문구
- `JA_GUARDIAN_SIGNUP_BRIDGE_ENABLED` DEV 활성화는 BE/보안 승인 후

---

## 6. BE에서 받을 산출물

- `openapi/backend.openapi.json` (3,4 최신)
- `openapi/backend.frontend-handoff.json`
- DEV NICE allowlist / callback URL

---

## 7. 관련 FE 경로

- `apps/platform/src/features/auth/identity-verification/api/guardian-client.ts`
- `apps/platform/src/features/auth/sign-up/hooks/use-sign-up.ts`
- `apps/platform/src/features/auth/sign-up/model/mapper/map-signup-request.ts`
- `apps/platform/src/pages/auth/sign-up/steps/guardian-agreement.tsx` · `guardian-identity.tsx`
- `apps/platform/src/pages/auth/sign-up/guardian-identity-callback.tsx`

**이전 BE 수정 요청(구 계약):** [signup-under14-general-backend-modification-request-2026-10-13.md](./signup-under14-general-backend-modification-request-2026-10-13.md) — **Guardian Bridge 도입 후 일부는 대체됨.**

**Last updated:** 2026-10-21
