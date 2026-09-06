# 일반(개인) 회원 상세 — 기본정보 PATCH 미반영 · individual unmask 1365 null · BE 수정 요청

**작성일:** 2026-09-04  
**우선순위:** **P0** (상세 수정 저장 실패 · 개인정보 원문 열람 불가)  
**요청 대상:** Members API · `PATCH /api/admin/users/{memberId}` · `POST /api/admin/users/{memberId}/individual/privacy/unmask`  
**관련 FE:**  
- `map-patch-user-basic-info.ts` (`mapPatchUserBasicInfoToApiRequest` · `AdminMemberBasicInfoUpdateRequestWithAddress`)  
- `admin-provisioned-member-basic-info-draft.ts` (`draftToAdminProvisionedIndividualBasicInfoPatch`)  
- `use-user-detail-controller.ts` (저장 · unmask · 1365 `external-identifiers` upsert)  
- `apply-privacy-unmask-to-user.ts` · `map-external-identifiers.ts`  
**선행:** [admin-register-signup-type-portal-profile-backend-request-2026-08-14.md](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md) §3·§8 (학년·소속 PATCH)  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` — `AdminMemberBasicInfoUpdateRequest` · `IndividualMemberDetailResponse` · `MemberDetailResponse`

---

## 1. 요약

일반(개인) 회원 상세에서 **기본정보 수정 저장 시 HTTP 200**이 오지만, 아래 필드는 **DB에 반영되지 않거나 재조회 시 이전 값**입니다.

| UI 라벨 | 저장 여부 (관측) |
|---------|------------------|
| 현재 학교 재학 여부 | ❌ |
| 소속 | ❌ |
| (소속 있는 경우) 학년 | ❌ |
| 자택주소지 | ❌ |
| 성명 / 연락처 / 이메일 / 성별 / 생년월일 | ✅ |
| 1365 ID | ✅ (`PATCH …/external-identifiers/{provider}` 별도 호출) |

또한 **개인정보 마스킹 해제** 시:

| API | 관측 |
|-----|------|
| `POST /api/admin/users/{memberId}/individual/privacy/unmask` | 회원에 1365 ID가 있는데도 응답 `member.external1365Id`가 **`null`** |

FE는 이미 GET·pre-register와 맞춘 wire 필드(`address` / `enrollmentStatus` / `schoolName` / `grade` 등)를 PATCH에 실어 보냅니다. **서버가 무시하거나 저장하지 않는 것이 원인**으로 보입니다. OpenAPI `AdminMemberBasicInfoUpdateRequest`에 해당 필드가 빠져 있어도, 런타임 JSON은 수신·영속해야 합니다(또는 OpenAPI·구현을 동시에 확장).

---

## 2. 재현

관리자 CMS · 실 API · **일반(개인) 회원** (`memberId` 예: `13`).

### 2.1 기본정보 PATCH

1. 회원 관리 → 개인 회원 상세 → **수정**.
2. 아래를 변경 후 저장.
   - 현재 학교 재학 여부 (재학 / 비재학)
   - 소속(학교명) · 학년(재학 시)
   - 자택주소지(도로명 + 상세)
   - (대조) 성명·연락처 등도 같이 변경
3. Network: `PATCH /api/admin/users/13` → **200**.
4. 상세 재조회(또는 모달 재오픈).

**기대:** 변경한 재학·소속·학년·자택주소가 유지.  
**실제:** 성명·연락처·이메일·성별·생년월일은 반영. **재학·소속·학년·자택주소는 미반영.**

### 2.2 individual privacy unmask · 1365

1. 동일 회원에 1365 ID가 존재 (상세/목록/`GET …/external-identifiers`에서 확인 가능, 마스킹 포함).
2. 상세에서 개인정보 열람(수정 진입 unmask 포함).
3. Network: `POST /api/admin/users/13/individual/privacy/unmask` + `{ "reason": "…" }`.

**기대:** `IndividualMemberDetailResponse.member.external1365Id`에 **원문** 1365 ID.  
**실제:** `member.external1365Id === null` (또는 누락).

---

## 3. API

| # | Method | Path | 화면 |
|---|--------|------|------|
| A | `PATCH` | `/api/admin/users/{memberId}` | 개인 회원 상세 · 기본정보 저장 |
| B | `POST` | `/api/admin/users/{memberId}/individual/privacy/unmask` | 개인 회원 상세 · 개인정보 원문 열람 |
| (참고) | `PATCH` | `/api/admin/users/{memberId}/external-identifiers/{provider}` | 1365 ID 저장(FE가 PATCH 기본정보와 **분리** 호출) — 이 경로는 동작함 |

권한: 관리자 · `MEMBER_WRITE` (PATCH) · `PRIVACY_RAW_READ` + 감사 `reason` (unmask).

---

## 4. FE가 보내는 PATCH body (계약)

OpenAPI 생성 타입 `AdminMemberBasicInfoUpdateRequest`에는 `name`·`phone`·`email`·`detailAddress`·`affiliation`·`gender`·`birthDate` 등만 있습니다.

개인 회원 상세 저장 시 FE는 **동일 path**에 아래 **확장 필드**를 함께 보냅니다.  
(주석 SSOT: `map-patch-user-basic-info.ts` — 개인 GET·pre-register의 `address`/`schoolName`/`enrollmentStatus`가 저장 SSOT.)

### 4.1 자택주소지

| FE draft | PATCH JSON 키 | 비고 |
|----------|---------------|------|
| `detailAddress` (도로명/검색) | `detailAddress`, `address`, `homeAddress` | 동일 street |
| `detailAddressDetail` | `addressDetail`, `homeAddressDetail` | 상세 주소 |

`detailAddress`만 보내고 `address`/`addressDetail`을 무시하면 **재조회 시 이전 주소**가 남습니다(현재 관측과 일치).

### 4.2 재학·소속·학년

| UI | PATCH JSON 키 | 값 예 |
|----|---------------|-------|
| 현재 학교 재학 여부 | `enrollmentStatus` | `ENROLLED` \| `NOT_ENROLLED` |
| 소속(학교명) | `schoolName` | 문자열. 비재학 시 `""` |
| 학년 | `grade` | 재학 시 학년 문자열. 비재학 시 `""` |
| CMS 학교 PK | `schoolOrganizationId` | number 또는 해제 시 **`null`(omit 금지)** |
| NEIS 등 검색 선택 | `schoolSelection` | `PortalSchoolSelectionRequest` (organizationId 없을 때) |

비재학 전환 시 FE 예:

```json
{
  "enrollmentStatus": "NOT_ENROLLED",
  "schoolName": "",
  "grade": "",
  "schoolOrganizationId": null
}
```

재학 + 기존 CMS 학교:

```json
{
  "enrollmentStatus": "ENROLLED",
  "schoolName": "○○고등학교",
  "grade": "2학년",
  "schoolOrganizationId": 123
}
```

`affiliation` 문자열만 갱신하고 `enrollmentStatus`/`schoolName`/`grade`를 무시하면 UI의 재학·소속·학년이 되돌아갑니다.

### 4.3 동작하는 필드 (대조)

| UI | PATCH / 별도 API |
|----|------------------|
| 성명 | `name` |
| 연락처 | `phone` |
| 이메일 | `email` |
| 성별 | `gender` |
| 생년월일 | `birthDate` |
| 1365 ID | **`PATCH …/external-identifiers/1365`(또는 계약 provider)** — 기본정보 PATCH body에 넣지 않음 |

---

## 5. unmask · `external1365Id`

### 5.1 응답 스키마 (OpenAPI)

`POST …/individual/privacy/unmask` → `IndividualMemberDetailResponse`:

- `member` → `MemberDetailResponse`
- `MemberDetailResponse.external1365Id` (string, optional)

상세 GET 예제에도 `external1365Id`가 있습니다(마스킹 예: `"1365-sam***"`).  
**unmask는 동일 필드의 원문**을 내려야 합니다.

### 5.2 기대

| 조건 | unmask 응답 |
|------|-------------|
| external-identifiers(또는 member 원장)에 1365 존재 | `member.external1365Id` = **원문** (마스킹 아님) |
| 1365 미등록 | `null` 또는 omit |

### 5.3 FE 사용

CMS는 unmask 응답의 `member.external1365Id`를 1365 표시·수정 draft SSOT로 사용합니다 (`assignUser1365IdFromDetailAndIdentifiers`).  
`null`이면 수정 인풋이 비거나 마스킹만 남아 **원문 편집 불가**.

---

## 6. 수용 테스트

### A. PATCH — 주소·재학·소속·학년

**Given:** 개인 회원 `memberId=13` (또는 동등).  
**When:** §4.1·§4.2 필드를 포함한 `PATCH /api/admin/users/{id}` → 200.  
**Then:** 직후 `GET` 상세(또는 individual detail)에서:

1. `address` / `addressDetail`(또는 동등 home 필드) = 요청값  
2. `enrollmentStatus` / `schoolName` / `grade` = 요청값  
3. `schoolOrganizationId` null 요청 시 소속 학교 연동 해제  
4. `name`·`phone` 등 기존 동작 필드도 유지

**And:** 비재학 → 재학 → 비재학 round-trip 후 값이 되살아나지 않을 것.

### B. unmask — 1365 원문

**Given:** 동일 회원에 1365 ID 존재(identifiers 또는 사전 PATCH로 확인).  
**When:** `POST …/individual/privacy/unmask` + 유효 `reason`.  
**Then:** `member.external1365Id`가 **null이 아닌 원문**.  
**And:** 마스킹 상세 GET의 `external1365Id`와 구분(unmask만 원문).

### C. OpenAPI (권장)

`AdminMemberBasicInfoUpdateRequest`에 §4 확장 필드를 공식 추가해 Orval·Swagger와 구현을 일치시킬 것.  
필드 추가 전에도 **알 수 없는 JSON을 조용히 버리고 200만 주지 말 것** — 미지원이면 **400** + 명확한 `error.code`.

---

## 7. 원인 가설 (BE 확인용)

1. PATCH 핸들러가 OpenAPI에 없는 `address`·`enrollmentStatus`·`schoolName`·`grade`·`schoolOrganizationId`·`schoolSelection`을 **바인딩에서 제외**하고 `name`/`phone` 등만 저장.  
2. `detailAddress`/`affiliation`만 갱신하고, 개인 상세 GET SSOT인 `address`/`schoolName`/`enrollmentStatus`와 **테이블이 분리**되어 있음.  
3. unmask 조립 시 `external1365Id`를 identifiers/원장에서 조회하지 않거나, 마스킹 전용 경로만 타고 원문 조인을 빼먹음.

---

## 8. FE 참고 (수정하지 말 것 · 이미 전송 중)

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/api/map-patch-user-basic-info.ts` | PATCH body 매핑 · 주소/재학 wire |
| `apps/cms/src/features/user/detail/lib/admin-provisioned-member-basic-info-draft.ts` | draft → patch |
| `apps/cms/src/features/user/detail/lib/use-user-detail-controller.ts` | 저장 · unmask · 1365 upsert |
| `apps/cms/src/features/user/api/apply-privacy-unmask-to-user.ts` | unmask → User 병합 |
| `apps/cms/src/features/user/api/map-external-identifiers.ts` | 1365 SSOT |

FE 추가 우회(로컬만 낙관 반영 등)는 **서버 미저장을 가리므로 하지 않습니다.** BE 저장·unmask 원문 반환이 필요합니다.

---

## 9. 전달 체크리스트

- [ ] `PATCH /api/admin/users/{id}` — 자택 `address`/`addressDetail`(및 FE가 보내는 동등 키) 영속
- [ ] 동 PATCH — `enrollmentStatus` / `schoolName` / `grade` / `schoolOrganizationId` / `schoolSelection` 영속
- [ ] 비재학·소속 해제(`schoolOrganizationId: null`) round-trip
- [ ] `POST …/individual/privacy/unmask` — 1365 존재 시 `member.external1365Id` 원문
- [ ] (권장) OpenAPI `AdminMemberBasicInfoUpdateRequest` 스키마 동기화 후 FE `generate:api`

**Last updated:** 2026-09-04
