# Handover: API 에러 메시지 — 사용자 노출 형식 (Platform · CMS 공통)

**대상:** 백엔드  
**앱:** Platform (`apps/platform`) · CMS (`apps/cms`) — **동일 API 서버**  
**일시:** 2026-07-31  
**우선순위:** P0

---

## 1. 요약

Platform·CMS 프론트는 API 실패 시 **`error.message`(또는 top-level `message`)를 번역·가공 없이** alert·모달·인라인 에러에 **그대로 표시**합니다.

Bean Validation 기본 문구·영문 개발자 메시지·필드 path가 내려오면 **최종 사용자 화면에 그대로 노출**됩니다.

**SSOT (상세 정책·예시·수락 기준):**  
[`apps/cms/docs/api/backend-handoff.md`](../../../cms/docs/api/backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통)

---

## 2. Platform FE — message 직접 노출 경로

| 화면/기능 | FE 경로 | 노출 |
|-----------|---------|------|
| 회원가입 (약관·이메일·가입 submit) | `get-signup-api-error-message.ts` | `response.data.message` → 폼/토스트 |
| 학교 검색 모달 | `school-search-modal.tsx` | `{error.message}` |
| 주소 검색 모달 | `address-search-modal.tsx` | `{error.message}` |
| NICE 본인인증 불일치 | (콜백/검증 API) | BE 메시지 없으면 FE 안내 불가 — [signup-public-api handover](./signup-public-api-401-and-nice-mismatch-handover.md) §3 |

---

## 3. BE 요청 (Platform 관점)

1. **`/api/homepage/**`** 4xx/5xx — `message`에 **한국어 사용자 문구** (필드명·제약 리터럴 X).
2. 회원가입 validation — 예: `이메일 형식을 확인해 주세요.` (O) · `email must be a well-formed email address` (X).
3. NICE 불일치 — FE가 표시할 **`error.code` + `error.message`** 쌍 제공 (§3 이슈 B).
4. CMS와 **동일 래퍼** `{ success, error: { code, message } }` 유지.

---

## 4. 관측 연계 (CMS — 동일 BE)

| API | 현재 메시지 예 | UI |
|-----|----------------|-----|
| `POST …/privacy/unmask` | `reason 크기가 5에서 500 사이여야 합니다` | CMS 「열람 실패」 모달 |

→ unmask `reason` minLength 완화: [CMS backend-handoff §에러 응답](../../../cms/docs/api/backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통)

---

## 5. BE 회신 부탁

1. validation 메시지 **한국어 사용자 문구** 전환 일정 · 공통 `MessageSource`/ExceptionHandler 정책
2. OpenAPI 4xx response `message` 예시 갱신
3. Platform 회원가입·NICE 관련 400/401 사용자 문구 샘플

**Last updated:** 2026-07-31
