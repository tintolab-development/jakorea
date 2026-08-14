# 백엔드 전달 — CMS 어드민 등록·가입유형·Portal 프로필 (2026-08-14)

CMS / Platform FE 기준으로 확인한 **서버 수정 요청**입니다.  
FE에서 이미 적용한 항목과, BE 저장·응답·투영이 필요한 항목을 구분합니다.

**관련 FE 경로**

- 가입유형 정규화: `apps/cms/src/features/user/api/resolve-member-registration-flags.ts`
- 목록 라벨: `apps/cms/src/features/user/shared/lib/member-list-display.ts` (`관리자 등록` / `직접 가입`)
- 개인 pre-register: `apps/cms/src/features/user/api/map-pre-register-request.ts`
- Portal 프로필: `apps/platform/src/features/auth/sign-in/api/parse-portal-member.ts`
- Portal PATCH: `apps/platform/src/features/auth/admin-registered/lib/map-profile-update.ts`

---

## 우선순위 요약

| P | # | 요약 | 담당 |
|---|---|------|------|
| P0 | 1–2 | 목록·상세 가입유형 플래그 | **BE** |
| P0 | 3 | 일반 회원 소속 학년 저장·조회 | **BE** (FE는 wire 전송 적용됨) |
| P0 | 4–6 | Portal GET 주소·소속 null | **BE** |
| P1 | 7 | ENROLLED 시 학교 필수 400 | BE 확인 + FE 가드 |
| P1 | 8 | 소속 해제 PATCH 미반영 | **BE** (FE payload OK) |

---

## 1) `GET /api/admin/members/all` — 가입유형 플래그

### 현상

전체 회원 목록에서 **관리자 등록 / 직접 가입**을 구분할 수 없음.

### FE 기대

행마다 아래 중 하나 이상 (권장: 세트로 내려줌):

| 필드 | 의미 |
|------|------|
| `preRegistered` | 관리자 사전등록 |
| `createdByAdmin` | 관리자 생성 |
| `registeredByAdmin` | (선택) 위와 동치 정규화값 |
| `identityVerified` | 본인 최초로그인·본인인증 완료 |
| `identitySelfSignupCompletedAfterAdminRegistration` | (선택) 명시 완료 플래그 |

FE 정규화:

- `registeredByAdmin` ← `registeredByAdmin \|\| preRegistered \|\| createdByAdmin \|\| (ADMIN + adminAccountId)`
- 완료 ← 명시 완료 플래그 **또는** `identityVerified === true`
- 목록 라벨「관리자 등록」= `registeredByAdmin && !완료`

### 현재 OpenAPI

`AccountDirectoryItemResponse`에 위 플래그 **없음**.  
MEMBER 행은 플래그 없으면 FE가「직접 가입」으로 떨어짐 → **관리자 등록 일반/강사/교사 오표기**.

### 요청

`GET /api/admin/members/all` 응답 각 행에 가입유형·본인인증 플래그 추가 (OpenAPI 반영).

---

## 2) 어드민 회원 목록 / 상세 — 가입유형 플래그

### 현상

관리자 계정 목록·상세에 가입유형 관련 플래그가 없음.

### FE 현재

`adminAccountId`만으로 `registeredByAdmin` 추론 → 본인인증 완료 후에도「관리자 등록」으로 남을 수 있음.

### 요청

- `GET /api/admin/admin-accounts` (목록)
- `GET /api/admin/admin-accounts/{id}` (상세)

에 `preRegistered` / `createdByAdmin` / `identityVerified` (또는 동등 플래그) 추가.

회원(`members`) 쪽:

- 목록: 이미 FE가 optional로 읽음 — **값만 채워 주면 됨**
- 상세 `MemberDetailResponse`: `preRegistered`, `createdByAdmin`, `identityVerified` 존재 — **실제 응답에 채워 줄 것**

---

## 3) 일반(개인) 회원 등록 — 소속 학년(`grade`)

### 현상

CMS에서 재학 중 + 소속 학교 + **학년** 입력해도 저장·상세·Portal에 학년 없음.

### FE (적용됨, 2026-08-14)

`POST` 개인 pre-register body에 재학 중일 때:

```json
{
  "schoolName": "진월초등학교",
  "enrollmentStatus": "ENROLLED",
  "grade": "3학년"
}
```

OpenAPI `AdminPreRegisterIndividualRequest`에는 아직 `grade` **미선언** — FE는 wire에 포함해 전송.

상세 GET에 `grade`가 오면 FE는 `affiliation = "{schoolName} | {grade}"`로 표시.

### 요청 (BE)

1. `AdminPreRegisterIndividualRequest`에 `grade?: string` 추가·저장
2. `IndividualMemberDetailResponse`에 `grade?: string` 반환
3. `GET /api/portal/me/profile`에도 `grade` 반환 (재학 회원)
4. (권장) CMS 개인 회원 기본정보 PATCH의 기존 `grade`와 동일 필드명 유지

---

## 4) 강사 신규 등록(회원 유형: 일반) — Portal 자택 주소 null

### 현상

- CMS 강사 상세: 자택 주소 **정상**
- Platform 최초로그인 `GET /api/portal/me/profile`: 주소 **null**

### FE

- CMS 등록: `homeAddress` / `homeAddressDetail` (및 profile.homeAddress) 전송
- Portal 파서: `address` / `addressDetail`만 읽음

### 요청 (BE)

Portal 프로필 GET에 CMS에 저장된 자택 주소를 `address` / `addressDetail`로 투영.  
(강사 저장 필드명이 `homeAddress`여도 Portal 계약은 `address`로 통일 권장.)

---

## 5) 동일 유형 — Portal 주소 PATCH 후 미반영

### 현상

`PATCH /api/portal/me/profile` response는 정상처럼 보이나, 이후 조회·화면에서 주소가 반영되지 않음.

### FE

PATCH body에 `address`, `addressDetail` 전송.

### 요청 (BE)

1. PATCH 값이 DB에 persist 되는지
2. 직후 GET이 동일 값을 반환하는지  
response만 가공하고 저장이 빠지는지 확인

---

## 6) 어드민 등록 교사·강사 — Portal GET 소속/학교/주소 null

### 현상

`GET /api/portal/me/profile`에서 소속·학교·주소 등이 전부 null.

### FE

전달된 필드를 그대로 표시. 값이 없으면 빈 화면.

### 요청 (BE)

어드민 pre-register로 생성된 교사·강사에 대해 Portal GET에 최소한:

| Portal 필드 | CMS 쪽 원천(예) |
|-------------|-----------------|
| `address` / `addressDetail` | `homeAddress` / `homeAddressDetail` |
| `schoolName` / `affiliationName` | 교사 소속 학교 / 강사 소속 기관 |
| `grade` | 해당 시 |
| `schoolOrganizationId` | 학교 FK |
| `schoolEnrollmentStatus` | 개인·해당 시 |
| `teacherEmploymentStatus` | 교사 재직 |

---

## 7) 일반 회원(학교 소속 X) — 최초로그인 중 소속 지정 시 400

### 현상

```
status=400
code=PORTAL_PROFILE_SCHOOL_REQUIRED_WHEN_ENROLLED
```

### FE payload (재학 중)

대략:

```json
{
  "schoolEnrollmentStatus": "ENROLLED",
  "schoolName": "<학교명>",
  "affiliationName": "<학교명>",
  "grade": "<학년>",
  "schoolOrganizationId": <number | omit>
}
```

UI는 재학 중이면 학교·학년 필수. 학교 검색으로 `schoolOrganizationId`를 넣는 경로와, 텍스트만 넣는 경로가 있을 수 있음.

### 요청 (BE)

1. `schoolName`만 있어도 ENROLLED 허용인지, **`schoolOrganizationId` 필수**인지 스펙 명확화
2. 필수라면 에러 메시지/문서에 orgId 명시
3. OpenAPI `UpdatePortalProfileRequest`에 `schoolName` 포함 여부 정리 (FE는 `schoolName`+`affiliationName` 둘 다 전송)

---

## 8) 일반 회원(학교 소속) — 소속 「해당 없음」으로 변경 시 미반영

### 현상

소속 해제로 수정해도 화면/재조회에 소속이 남음. PATCH response에는 일부만 반영되어 보임.

### FE clear payload

```json
{
  "schoolEnrollmentStatus": "NOT_ENROLLED",
  "schoolName": "",
  "grade": "",
  "affiliationName": "",
  "schoolOrganizationId": null
}
```

`schoolOrganizationId`는 **omit하지 않고 `null`** — omit 시 서버가 기존 FK를 유지하는 문제를 피하기 위함.

### 요청 (BE)

1. `schoolOrganizationId: null` + 빈 이름 + `NOT_ENROLLED` 시 소속 **완전 해제**
2. GET이 해제 후 null/빈 값을 반환하는지 확인
3. response와 DB persist 불일치 여부 확인

---

## FE 측 상태 (참고)

| # | FE |
|---|-----|
| 1–2 | 플래그 수신 시 목록·상세·수정잠금 연동 준비됨. 전체 목록 OpenAPI 필드 추가 후 codegen만 필요 |
| 3 | **grade wire 전송 적용** (OpenAPI 반영·BE 저장 필요) |
| 4–6 | Portal 주소 별칭(`homeAddress`) 폴백은 선택 하드닝 가능. **근본은 BE 투영** |
| 7 | UI 검증 있음. orgId 필수면 FE에서 검색 선택 강제 가능 |
| 8 | clear payload 의도대로 구현됨 → **BE persist** |

---

## 验收 체크리스트 (BE)

- [ ] `/api/admin/members/all` 행에 가입유형·본인인증 플래그
- [ ] admin-accounts 목록·상세에 동일(또는 동등) 플래그
- [ ] 개인 pre-register `grade` 저장 + individual detail / portal GET `grade` 반환
- [ ] 어드민 등록 강사·교사 portal GET에 address·소속 투영
- [ ] portal PATCH address persist + GET 일치
- [ ] ENROLLED 시 학교 필수 규칙 문서화 (name vs orgId)
- [ ] 소속 clear (`schoolOrganizationId: null`) persist + GET 일치

**Last updated:** 2026-08-14
