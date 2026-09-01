# CMS 전체 회원 목록 — 연락처·이메일 마스킹 재적용 · BE 수정 요청

**작성일:** 2026-08-31  
**우선순위:** **P0** (PII 목록 원문 노출)  
**요청 대상:** Members directory · `GET /api/admin/members/all`  
**관련 FE:** `user-list.tsx` (`kind=all`) · `members-api-client.ts` (`listAllCmsMembersAndAdmins`)  
**정책 SSOT:** `apps/cms/src/shared/constants/download-policy.ts` — `MASKING_POLICY.phone` / `MASKING_POLICY.email`  
**OpenAPI:** `listAllCmsMembersAndAdmins` — 「개인정보 노출 기준: **기본 마스킹 응답**」 (`AccountDirectoryItemResponse.email` · `phone`)

---

## 1. 요약

`GET /api/admin/members/all` 목록 응답의 **연락처(`phone`)·이메일(`email`)이 원문 그대로** 내려옵니다.

OpenAPI와 CMS 개인정보 정책은 이 API를 **기본 마스킹 응답**으로 둡니다. 이름(`name`)은 목록에서 실명 유지. **연락처·이메일만** 정책대로 다시 마스킹해 달 것.

원문은 상세 `privacy/unmask` 또는 감사 있는 export에서만. 목록 GET에 원문을 실으면 안 됩니다.

---

## 2. 재현

관리자 CMS, 실 API.

1. 회원 관리 → **전체 회원** 탭 (`kind=all`).
2. Network: `GET /api/admin/members/all`.
3. `items[].phone`, `items[].email` 확인.

**기대 (마스킹 예):**

| 필드 | 원문 예 | 목록 응답 |
|------|---------|-----------|
| `phone` | `010-1234-5678` | `010-****-5678` |
| `email` | `0915123@naver.com` | `091***@naver.com` |

**실제:** 하이픈 있는 휴대폰·로그인 이메일이 **풀 원문**.

이름·상태·역할·가입일 등은 이번 범위 밖. **연락처·이메일만** 요청.

---

## 3. API

| Method | Path | 화면 |
|--------|------|------|
| `GET` | `/api/admin/members/all` | 회원 관리 · 전체 회원 목록 |

권한: 관리자 · `ADMIN_READ` + `MEMBER_READ`.  
응답: `PageResponseAccountDirectoryItemResponse` → `AccountDirectoryItemResponse`.

OpenAPI 현행: 「개인정보 노출 기준: 기본 마스킹 응답」 · 감사로그 필수.  
구현이 문서와 어긋난 상태(원문 반환). 계약을 코드에 맞출 것.

목록 전용. 상세 GET 기본 마스킹·unmask 흐름은 유지.

---

## 4. 마스킹 규칙 (CMS `MASKING_POLICY`)

서버가 같은 결과를 내면 FE는 전체 탭에서 **다시 마스킹하지 않음** (`user-list.tsx`: `kind === 'all'` → `maskListPii = false`). **서버가 SSOT.**

### 4.1 연락처 `phone`

가운데 구간만 `*`.

| 입력 | 출력 |
|------|------|
| `010-1234-5678` | `010-****-5678` |
| `01012345678` | `010-****-5678` |
| `02-1234-5678` | `02-****-5678` |
| `02-123-4567` | `02-***-4567` |
| `031-123-4567` | `031-***-4567` |

빈 값·null은 그대로.

### 4.2 이메일 `email`

로컬 파트 **앞 3글자** + `***` + `@도메인`. 로컬이 3글자 이하면 로컬 전부 + `***`.

| 입력 | 출력 |
|------|------|
| `0915123@naver.com` | `091***@naver.com` |
| `ab@jakorea.org` | `ab***@jakorea.org` |
| `abc@jakorea.org` | `abc***@jakorea.org` |

`@` 없는 값은 그대로. 도메인은 마스킹하지 않음.

### 4.3 하지 말 것

- 목록 GET에 원문 `phone`/`email` + 감사 `UNMASKED_VIEW`로 우회.
- 이름까지 마스킹 (요청 없음).
- 검색(`keyword`)은 원문 기준으로 하되 **응답 본문만** 마스킹. 검색이 안 되면 별도 회신.
- 이미 `*`가 있는 값을 한 번 더 마스킹.

---

## 5. 요청

1. `GET /api/admin/members/all`의 모든 행(`MEMBER` · `ADMIN_ACCOUNT`) `phone`·`email`을 §4대로 마스킹.
2. 원문은 이 path의 기본 GET에 넣지 말 것. 필요 시 기존 unmask/export + 사유·감사.
3. OpenAPI `AccountDirectoryItemResponse.email` / `phone` description에 **목록은 마스킹 값**을 명시.
4. 스테이징에서 전체 탭 Network 응답이 §2 기대와 같은지 확인.

---

## 6. 검증

- [ ] 전체 회원 목록 응답 `phone`/`email`에 원문 휴대폰·풀 로컬 이메일 없음
- [ ] §4 표와 형식 일치
- [ ] 이름 실명 유지
- [ ] keyword 검색은 기존과 동일하게 동작
- [ ] 회원 상세 unmask 후 상세 원문 표시는 유지 (목록 GET과 분리)

---

## 7. FE 참고

| 파일 | 내용 |
|------|------|
| `apps/cms/src/shared/constants/download-policy.ts` | `MASKING_POLICY.phone` / `email` |
| `apps/cms/src/features/user/shared/ui/user-list.tsx` | 전체 탭은 BE 값을 그대로 표시 (이중 마스킹 없음) |
| `apps/cms/src/shared/api/generated/members/members-api.ts` | `listAllCmsMembersAndAdmins` — 기본 마스킹 응답 |

BE가 다시 마스킹하면 전체 탭 UI는 추가 FE 작업 없이 맞춰짐.
