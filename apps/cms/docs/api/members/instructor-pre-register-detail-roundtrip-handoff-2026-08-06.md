# 강사 사전등록 ↔ 상세조회 round-trip — 미반영·관측 갭

**작성일:** 2026-07-31 · **갱신(파일명 기준):** 2026-08-06  
**우선순위:** P0 (등록 후 상세 표시)  
**관련 API**

| Method | Path | 스키마 |
|--------|------|--------|
| `POST` | `/api/admin/users/pre-register/instructor` | `AdminPreRegisterInstructorRequest` |
| `GET` | `/api/admin/users/{memberId}/instructor` | `InstructorMemberDetailResponse` |
| `POST` | `/api/admin/users/{memberId}/instructor/privacy/unmask` | unmask |
| `GET` | `/api/admin/users/{memberId}/consent-records` | `MemberConsentRecordResponse[]` |
| `GET` | `/api/admin/users/{memberId}/affiliated-teachers` | 소속 교사 목록 (학교↔교사 매핑) |

**관련 FE**

- 등록: `instructor-register-modal.tsx` · `user-list-page.tsx` · `map-pre-register-request.ts` · `map-instructor-cms-profile.ts`
- 상세: `map-member-detail-to-user.ts` · `map-user-to-instructor-profile-form.ts` · `user-to-applicant-instructor-row.ts` · `user-detail-fullpage-basic-tab-content.tsx`
- 약관: `build-pre-register-terms-agreements.ts` · `map-member-consent-records.ts`
- FE DTO (codegen 전): `instructor-cms-profile-proposal.ts` · §3.8 shape

**선행·보조 문서**

- [members-pre-register-handover-2026-07-28.md](./members-pre-register-handover-2026-07-28.md) §C
- [instructor-register-ui-openapi-mismatch-2026-08-06.md](./instructor-register-ui-openapi-mismatch-2026-08-06.md) — UI↔OpenAPI 필드 갭 SSOT

---

## 1. E2E 관측 (2026-07-31)

### 1.1 등록 요청 (발췌)

```json
{
  "email": "ins@test.com",
  "name": "김강사",
  "rawPassword": "ins@test.com",
  "phone": "01033275124",
  "gender": "M",
  "birthDate": "1997-07-21",
  "instructorType": "SCHOOL_TEACHER",
  "_cmsFormNote": "교사 회원 등록 UI는 schoolName·employmentStatus(재직)를 수집하나, 아래 JSON에는 affiliation/schoolName 필드가 없음 — §3.5",
  "homeAddress": "경기도 고양시 덕양구 무원로 1 (행신동)",
  "homeAddressDetail": "현소네",
  "oneLineIntro": "뀨",
  "careerText": "10",
  "selfIntroduction": "ㅋㅋ",
  "educationLevel": "college4 / graduated",
  "termsAgreements": [
    { "termsType": "SERVICE_TERMS", "version": "1.0", "required": true, "agreed": true },
    { "termsType": "PRIVACY_COLLECTION", "version": "1.0", "required": true, "agreed": true },
    { "termsType": "MARKETING", "version": "1.0", "required": false, "agreed": false }
  ],
  "bankName": "우리은행",
  "accountNumber": "1002859723089",
  "businessIncome": false,
  "bankAccounts": [{ "bankName": "우리은행", "accountNumber": "1002859723089" }]
}
```

### 1.2 상세 응답 — **마스킹 GET** (발췌)

`GET /api/admin/users/{memberId}/instructor` · 상세보기 **전**

```json
{
  "member": {
    "memberId": 2,
    "email": "ins***@test.com",
    "name": "김강사",
    "phone": "010-****-5124",
    "birthDate": "1997-07-21",
    "gender": "M",
    "status": "ACTIVE",
    "roles": ["GENERAL", "INSTRUCTOR"],
    "preRegistered": true,
    "createdByAdmin": true
  },
  "instructorProfile": {
    "status": "APPROVED",
    "primaryActivityType": "SCHOOL_TEACHER",
    "businessIncomeYn": false,
    "homeAddress": "경기도 고양시 덕양구",
    "homeAddressDetail": null,
    "educationLevel": "마스킹",
    "careerText": "마스킹",
    "selfIntroduction": "마스킹",
    "oneLineIntro": "마스킹"
  },
  "bankName": "우리은행",
  "accountNumber": "*************",
  "accountHolder": "김**",
  "bankAccounts": [{ "bankName": "우리은행", "accountNumber": "*************", "accountHolder": "김**", "current": true }],
  "certifications": []
}
```

### 1.3 상세 응답 — **unmask GET** (발췌)

`POST /api/admin/users/{memberId}/instructor/privacy/unmask` (또는 unmask 후 동일 path 재조회) · 상세보기 **후**

```json
{
  "member": {
    "memberId": 2,
    "uuid": "2d1336e0-ba8c-47f0-8753-96719151cc66",
    "email": "ins@test.com",
    "name": "김강사",
    "phone": "01033275124",
    "birthDate": "1997-07-21",
    "gender": "M",
    "status": "ACTIVE",
    "roles": ["GENERAL", "INSTRUCTOR"],
    "preRegistered": true,
    "createdByAdmin": true
  },
  "instructorProfile": {
    "status": "APPROVED",
    "primaryActivityType": "SCHOOL_TEACHER",
    "defaultFeeGrade": null,
    "defaultJaGrade": null,
    "businessIncomeYn": false,
    "homeAddress": "경기도 고양시 덕양구 무원로 1 (행신동)",
    "homeAddressDetail": "현소네",
    "educationLevel": "college4 / graduated",
    "careerText": "10",
    "selfIntroduction": "ㅋㅋ",
    "oneLineIntro": "뀨"
  },
  "bankName": "우리은행",
  "accountNumber": "1002859723089",
  "accountHolder": null,
  "bankAccounts": [
    {
      "bankName": "우리은행",
      "accountNumber": "1002859723089",
      "accountHolder": null,
      "current": true
    }
  ],
  "certifications": []
}
```

### 1.4 마스킹 GET vs unmask GET — 필드별 round-trip (memberId=2)

| 필드 | 등록 값 | 마스킹 GET | unmask GET | 판정 |
|------|---------|------------|------------|------|
| `member.email` | `ins@test.com` | `ins***@test.com` | `ins@test.com` | ✅ 마스킹·unmask 정상 |
| `member.phone` | `01033275124` | `010-****-5124` | `01033275124` | ✅ |
| `homeAddress` | 도로명 전체 | **시·군·구만** | **등록 원문** | ⚠️ 마스킹 GET truncation |
| `homeAddressDetail` | `현소네` | **`null`** | **`현소네`** | ⚠️ 마스킹 GET 미반환 · unmask ✅ |
| `oneLineIntro` | `뀨` | `"마스킹"` | `뀨` | ❌ §3.2 · CMS **「한 줄 소개」** |
| `careerText` | `10` | `"마스킹"` | `10` | ❌ §3.2 · CMS **「강사 경력」**(≠ 구조화 경력사항) |
| `selfIntroduction` | `ㅋㅋ` | `"마스킹"` | `ㅋㅋ` | ❌ §3.2 · CMS **「자유작성 1」**(≠ 한 줄 소개) |
| `educationLevel` | `college4 / graduated` | `"마스킹"` | `college4 / graduated` | ❌ §3.2 · CMS **「최종 학력」** 코드 · FE 한글 변환 |
| `accountNumber` | `1002859723089` | `*************` | `1002859723089` | ✅ |
| `accountHolder` | (미전송) | `null` | **`null`** | ❌ unmask 후에도 null |
| `defaultFeeGrade` | — | `null` | `null` | — (미설정) |
| `instructorProfile.status` | — | `APPROVED` | `APPROVED` | ✅ (강사비 등급과 **별도**) |
| 소속 학교명 (`schoolName`) | CMS 폼 입력 | **없음** | **없음** | ❌ §3.5 |
| 재직 현황 (`employmentStatus`) | CMS 폼 입력 | **없음** | **없음** | ❌ §3.5 |
| `affiliatedSchoolUserId` (기관↔교사) | — | **없음** | **없음** | ❌ §3.5 · `affiliated-teachers` 연동 |

**요약:** DB 저장·unmask round-trip은 **대부분 정상**. 잔여 P0는 **마스킹 GET 정책 오적용(§3.2 — 경력·소개·학력)**, **마스킹 GET**(`homeAddress` truncation, `homeAddressDetail` null), **강사 소속·학교↔교사 매핑**(§3.5), **`accountHolder`**, **동의·스키마 확장** 쪽.

---

## 2. 반영 vs 미반영 요약

| 구분 | 등록 필드 | 마스킹 GET | unmask GET | CMS (2026-07-31) |
|------|-----------|------------|------------|------------------|
| ✅ | `email`, `phone` | 마스킹 | 원문 | 상세보기 전/후 |
| ✅ | `name`, `gender`, `birthDate` | 원문 | 원문 | 기본정보 |
| ✅ | `instructorType` | `primaryActivityType` | 동일 | `school_teacher` 레이아웃 **분기만** (소속 데이터는 §3.5) |
| ⚠️ | 소속 학교명 (`profile.affiliation.schoolName`) | **없음** | **없음** | FE **등록·PATCH 전송(2026-08-06)** · BE 미수신 |
| ⚠️ | 재직 현황 (`profile.affiliation.employmentStatus`) | **없음** | **없음** | FE 전송 · BE 미수신 |
| ⚠️ | `affiliation` (학교명 \| 재직) | **없음** | **없음** | FE `profile.affiliation` + legacy flat 병행 |
| ❌ | `affiliatedSchoolUserId` | **없음** | **없음** | 학교↔교사 **양방향 링크 불가** |
| ❌ | 학교↔교사 affiliation | — | — | `GET …/affiliated-teachers` **미연결** |
| ✅ | `businessIncome` | `businessIncomeYn` | 동일 | 사업소득자 |
| ✅ | `bankName`, `accountNumber` | 마스킹 | 원문 | 정산 계좌 |
| ⚠️ | `homeAddress` | **시·군·구만** | **원문** | unmask 후 전체 노출 |
| ⚠️ | `homeAddressDetail` | **`null`** | **원문** | unmask 후 상세 input 분리 |
| ❌ | `oneLineIntro`, `careerText`, `selfIntroduction`, `educationLevel` | **`"마스킹"` (오적용)** | **원문** | FE: placeholder → `-` · **BE §3.2** · **필드명↔화면 §3.2 표** |
| ⚠️ | `educationLevel` 형식 | — | `college4 / graduated` 코드 | FE 한글 라벨 변환 |
| ❌ | `accountHolder` | `null` | **`null`** | 예금주 미저장 |
| ⚠️ | `termsAgreements` | 상세 DTO **없음** | — | FE **8건 pre-register 전송** · `consent-records`/`termsAgreements` round-trip **BE 대기** |
| ⚠️ | 동의서 작성형 5종 | `agreed`만 전송 | — | **`formResponseId`·전문 스냅샷 BE API 대기** |
| — | `certifications` | `[]` | `[]` | FE `profile.licenses` + root `certifications[]` 병행 전송 |
| ⚠️ | 구조화 학력·경력·JA·수상 | 스키마 없음 | — | FE **`profile` 전송(2026-08-06)** · BE 미저장 |
| ⚠️ | 자유작성 2~4 | 필드 없음 | — | FE **`profile.essays.freeWrite2~4` 전송** · BE 미저장 |
| ❌ | 자유작성 1 (`selfIntroduction`) | **`"마스킹"` (오적용)** | `selfIntroduction` | §3.2 · legacy flat + `profile.essays.freeWrite1` |

---

## 3. BE 수정 필요 내역 (회원관리 > 강사 등록·상세)

> **2026-08-06 갱신:** FE가 §3.8 `profile` / `settlement` 구조체를 **등록·상세·PATCH**에 연동 완료.  
> OpenAPI `AdminPreRegisterInstructorRequest` / `InstructorMemberDetailResponse`에는 **아직 `profile`·`settlement` 키 없음** — BE는 §3.8 shape 수락·저장·반환·codegen이 **최우선 P0**.
>
> **2026-07-31 재관측:** unmask 후 `homeAddressDetail`·소개·경력·학력·계좌번호 등 **등록 원문 round-trip 확인됨**.  
> 잔여 P0: **§3.8 OpenAPI·저장** · **§3.2 마스킹 GET** · **§3.5 소속** · **§3.4 약관·동의** · **§3.1 마스킹 GET 주소**.

### 3.0 우선순위 요약 (2026-08-06)

| P | 항목 | FE (2026-08-06) | BE |
|---|------|-----------------|-----|
| **P0** | §3.8 `InstructorCmsProfile` / `InstructorCmsSettlement` — OpenAPI·GET·pre-register·PATCH | ✅ `profile`+`settlement` 전송 · loose 수신 · legacy flat **병행** | ❌ 스키마 미등록 · 저장·반환 없음 |
| **P0** | §3.2 마스킹 GET — `oneLineIntro`·`careerText`·`selfIntroduction`·`educationLevel` | ✅ `"마스킹"` → 화면 `-` | ❌ 공개 필드에 `"마스킹"` 오적용 |
| **P0** | §3.5 교사 소속 · `affiliated-teachers` | ✅ `profile.affiliation.{schoolName,employmentStatus}` 전송 | ❌ 수신·GET·affiliation row |
| **P0** | §3.4 약관 8건 · `consent-records` | ✅ pre-register `termsAgreements` · 상세 매핑(`map-member-consent-records`) | ❌ 저장 round-trip · 강사 상세 `termsAgreements` 없음 |
| **P0** | §3.1 마스킹 GET — `homeAddress` / `homeAddressDetail` | — | ❌ truncation · detail `null` |
| **P1** | §3.6 `accountHolder` | ✅ `settlement.accountHolder` 전송 | ❌ unmask 후에도 `null` 관측 |
| **P1** | 동의서 작성형 — `formResponseId`·전문 | UI `agreed`만 · 작성 완료 UX(2026-08-06) | ❌ 증빙·스냅샷 API |
| **P2** | `feeGrade` / `jaGrade` | 등록 UI 미수집 | OpenAPI만 존재 |

**FE codegen 전 타입 SSOT:** `apps/cms/src/features/user/api/types/instructor-cms-profile-proposal.ts`  
**Mapper:** `map-instructor-cms-profile.ts` (`instructorProfileFormValuesToCmsProfile` · `instructorCmsProfileToFormValues` · legacy flat 호환)

### 3.1 자택 주소 — **마스킹 GET** (P0)

| 필드 | unmask GET (확인됨) | 마스킹 GET (문제) | BE 요청 |
|------|---------------------|-------------------|---------|
| `homeAddress` | `경기도 고양시 덕양구 무원로 1 (행신동)` ✅ | `경기도 고양시 덕양구` only | 마스킹 GET도 **시·군·구 + 정책상 허용 범위** 일관 적용 · OpenAPI 명시 |
| `homeAddressDetail` | `현소네` ✅ | **`null`** | 마스킹 GET에서 **`null` 대신** 마스킹 placeholder(예: `"마스킹"`) 또는 시·군·구와 분리된 마스킹 값 반환 |

- **저장·unmask:** ✅ 정상 — §1.3·§1.4
- **수정 대상:** 마스킹 GET만 (상세보기 **전** CMS 자택 주소·상세 주소 표시)

### 3.2 강사 프로필 공개 필드 — **마스킹 GET 오적용** (P0)

**문제:** `GET /api/admin/users/{memberId}/instructor` (및 individual 등 역할별 상세) 기본 응답에서 `instructorProfile`의 아래 필드가 리터럴 `"마스킹"`으로 내려옴.  
**개인정보 상세보기(unmask) 없이도** CMS 기본정보·이력서 영역에 표시해야 하는 **비-PII** 데이터임.

**관측 JSON (memberId=2, 2026-07-31):**

```json
{
  "instructorProfile": {
    "educationLevel": "마스킹",
    "careerText": "마스킹",
    "selfIntroduction": "마스킹",
    "oneLineIntro": "마스킹"
  },
  "member": {
    "email": "ins***@test.com",
    "phone": "010-****-5124"
  }
}
```

등록 시 전송값: `oneLineIntro: "뀨"`, `careerText: "10"`, `selfIntroduction: "ㅋㅋ"`, `educationLevel: "college4 / graduated"` — DB·unmask GET에는 **원문 저장됨**.

#### CMS 마스킹 정책 SSOT ([members-api-backend-handoff-2026-07-31.md](./members-api-backend-handoff-2026-07-31.md) §5.1)

| 구분 | 마스킹 GET 기본 응답 |
|------|----------------------|
| **마스킹 대상 (PII)** | 전화번호 · 이메일 · 자택 주소(동 이후) · 계좌번호·예금주 · 1365 ID |
| **미마스킹 (원문)** | 회원명 · 성별 · 생년월일 · **강사 경력(`careerText`)** · **한 줄 소개(`oneLineIntro`)** · **자기소개(`selfIntroduction`)** · **최종 학력(`educationLevel`)** · JA/강사비 등급 · 사업소득 여부 · 기관 주소 |

#### BE 수정 요청

| 필드 (`instructorProfile`) | 현재 마스킹 GET | 기대 마스킹 GET |
|----------------------------|-----------------|-----------------|
| `oneLineIntro` | `"마스킹"` | **등록 원문** (예: `뀨`) |
| `careerText` | `"마스킹"` | **등록 원문** (예: `10` 또는 `10년`) |
| `selfIntroduction` | `"마스킹"` | **등록 원문** |
| `educationLevel` | `"마스킹"` | **등록 원문** (예: `college4 / graduated`) |

1. 마스킹 GET에서 위 필드에 `"마스킹"` placeholder **적용 금지** — unmask API 호출 없이 상세·이력서에 노출.
2. OpenAPI `InstructorDetailResponse` · 역할별 상세 schema에 **필드별 마스킹 여부** 명시 (§5.1 표와 동일).
3. `"마스킹"` placeholder는 **PII 필드에만** 사용 (또는 `null`/부분 마스킹 규칙) — 공개 프로필 텍스트에는 사용하지 않음.

#### CMS 화면 ↔ OpenAPI 필드명·의미 불일치 (P0 — 스키마·문서화)

BE `instructorProfile` 필드명(`careerText`, `oneLineIntro`, `selfIntroduction`, `educationLevel`)은 **CMS 화면 라벨·섹션과 1:1로 대응되지 않음**.  
마스킹·round-trip 이슈 논의 시 아래 매핑표를 SSOT로 사용할 것.

| OpenAPI (`instructorProfile`) | CMS **등록** UI (라벨 · form name) | CMS **상세** UI (라벨 · FE state) | 정합 |
|-------------------------------|-------------------------------------|-----------------------------------|------|
| `careerText` | 기본정보 **「강사 경력」** · `instructorCareer` | 기본정보 **「강사 경력」** · `instructorCareerText` / `listMetrics.instructorCareer*Label` | ⚠️ API명 `careerText`는 화면에 **노출되지 않음** |
| `oneLineIntro` | 기본정보 **「한 줄 소개」** · `oneLineIntro` | 기본정보 **「한 줄 소개」** · `user.bio` | ✅ 라벨 일치 |
| `selfIntroduction` | 이력서 **「자유작성 1 — 자기소개 및 지원동기」** · `freeWrite1` | 이력 resume **자유작성 1** · `instructorSelfIntroduction` | ⚠️ API명 `selfIntroduction` ≠ 기본정보 「한 줄 소개」 · **`oneLineIntro`와 별개 필드** |
| `educationLevel` | 학력 **학교 구분 + 재학/졸업** · `eduSchoolType` / `eduStatus` → `"college4 / graduated"` 등 **코드 문자열** | 이력 **「최종 학력」** · `listMetrics.highestEducationLabel` (FE 한글 변환) | ⚠️ API 단일 코드 vs 화면 2필드·표시 라벨 상이 |

**등록 폼과 API가 연결되지 않는 CMS UI (별도 이슈 — §3.7):**

| CMS UI 섹션 | 등록 폼 | pre-register body | 비고 |
|-------------|---------|-------------------|------|
| **경력사항** (구조화 rows · 경력 구분 · 활동 이력) | `careerRows`, `activityRows` 등 | **미전송** | `careerText`는 **연차 요약 한 줄**만 — 구조화 경력과 **다름** |
| **학력** (구조화 rows) | `educationRows` | **미전송** | `educationLevel`은 **요약 코드**만 |
| **자유작성 2~4** | `freeWrite2`~`4` | **미전송** | API 필드 **없음** |

**혼동 방지 (BE·QA):**

1. `"마스킹"` placeholder가 **`oneLineIntro`·`selfIntroduction` 둘 다**에 오면, CMS에서는 **「한 줄 소개」**와 **「자유작성 1」**이 **동시에** `-`로 보임 — 서로 다른 입력란임.
2. `careerText` 마스킹은 **기본정보 「강사 경력」**만 영향 · 이력서 「경력사항」 테이블과 **무관**(후자는 API 미연동).
3. OpenAPI·Swagger 필드 description에 **CMS 화면 라벨(한글)** 과 **등록 form field name**을 명시하거나, BE DTO alias를 화면 용어에 맞출 것을 권장.

**BE 요청 (필드 명세):**

- `InstructorDetailResponse` 각 property에 `@Schema(description=…)` — CMS 라벨·등록 form key·마스킹 여부(§5.1) 동시 기재.
- (선택) 장기적으로 `oneLineIntro` / `selfIntroduction` / `careerSummaryYears` 등 **화면 용어와 align** 한 naming revision 검토 — breaking change 시 FE mapper·handoff 동시 갱신.

#### FE 임시 대응 (2026-07-31)

- `"마스킹"` 수신 시 경력·소개·학력은 **User/state에 저장하지 않음** · 화면 `-` 표시.
- BE §3.2 반영 후 **추가 FE 변경 불필요** (원문 GET 즉시 표시).

### 3.3 PII 마스킹 · unmask — **문서화** (P1)

| 필드 | 마스킹 GET (정책) | unmask GET (2026-07-31 확인) |
|------|-------------------|------------------------------|
| `member.email` / `phone` | 마스킹 | 원문 ✅ |
| `accountNumber` / `accountHolder` | `*` 마스킹 | 원문 ✅ |
| `homeAddress` / `homeAddressDetail` | §3.1 | 원문 ✅ |

**BE 요청 (잔여):**

1. unmask 응답 DTO = `InstructorMemberDetailResponse` 와 **동일 shape** 문서화 (별도 DTO vs GET 재조회)
2. §3.2 반영 후 `"마스킹"` placeholder 사용 필드 목록 OpenAPI enum/설명 갱신

### 3.4 관리자 등록 — 약관·동의 (P0)

#### CMS 등록 모달 vs API (2026-07-31)

| 등록 유형 | 화면 (`DetailInfoForm`) | OpenAPI body | FE → API (2026-07-31) | 상세 `consent-records` |
|-----------|-------------------------|--------------|------------------------|-------------------------|
| **학교(기관)** | **0건** — `school-register-modal.tsx`에 약관 섹션 없음 | `AdminPreRegisterSchoolRequest.termsAgreements?` | **미전송** (UI 없음) | — |
| **강사** | **8건** — 라디오 3 + 동의서 작성 5 | `AdminPreRegisterInstructorRequest.termsAgreements?` | **8건 전송** (`buildPreRegisterTermsAgreements`) | BE 저장·`consentType` 매핑 대기 |
| **관리자** | **4건** — 서비스·개인정보·마케팅·MFA | `AdminAccountCreateRequest` — **`termsAgreements` 없음** | **0건** (스키마 없음) | BE 스키마 추가 후 FE 연동 |
| **개인(전체 회원 신규)** | **8건** — 강사와 동일 구성 | `AdminPreRegisterIndividualRequest.termsAgreements?` | **8건 전송** (2026-07-31 FE) | BE round-trip 대기 |

**화면 파일**

| 등록 | 컴포넌트 |
|------|----------|
| 학교 | `apps/cms/src/features/school/ui/school-register-modal.tsx` |
| 강사 | `instructor-profile-form-body.tsx` (약관 8건) · submit `user-list-page.tsx` |
| 관리자 | `admin-register-modal.tsx` |
| 개인 | `add-user-individual.tsx` |

#### 강사·개인 — 8건 UI ↔ `termsAgreements.termsType`

| # | CMS 라벨 | UI 입력 | `termsType` | 비고 |
|---|----------|---------|-------------|------|
| 1 | 서비스 이용약관 | 라디오 | `SERVICE_TERMS` | required |
| 2 | 개인정보 수집·이용 | 라디오 | `PRIVACY_COLLECTION` | required |
| 3 | 마케팅 제공 | 라디오 | `MARKETING` | optional |
| 4 | 초상권 | 동의서 작성 | `PORTRAIT_RIGHTS` | `agree`일 때만 body 포함 |
| 5 | 지급조서 | 동의서 작성 | `PAYMENT_STATEMENT_PRE_CONSENT` | canonical · alias `PAYMENT_STATEMENT_CONSENT` 허용 |
| 6 | 교육진행자 서약 | 동의서 작성 | `FACILITATOR_PLEDGE` | alias `EDUCATOR_PLEDGE` |
| 7 | 행정정보 공동이용 | 동의서 작성 | `ADMINISTRATIVE_INFO_CONSENT` | alias `ADMINISTRATIVE_JOINT` |
| 8 | 성범죄 경력 조회 | 동의서 작성 | `CRIMINAL_HISTORY_CHECK_CONSENT` | alias `SEX_OFFENSE_CHECK` |

- FE: `apps/cms/src/features/user/api/build-pre-register-terms-agreements.ts`
- 동의서 작성형 — **`agreed: true/false`만** 전송 · `formResponseId`·전문 스냅샷 **BE API 확정 후** 추가
- 상세: `InstructorMemberDetailResponse`에 **`termsAgreements` 없음** (개인 상세에는 있음) → `GET …/consent-records` **`consentType` ↔ 위 `termsType` 1:1** 필수
- FE 상세 매핑: `map-member-consent-records.ts` — `termsAgreements` 있으면 SSOT · 없으면 `consent-records` fallback

#### 관리자 4건 — BE 요청

| # | CMS 라벨 | 제안 `termsType` |
|---|----------|------------------|
| 1 | 서비스 이용약관 | `SERVICE_TERMS` |
| 2 | 개인정보 수집·이용 | `PRIVACY_COLLECTION` |
| 3 | 마케팅 제공 | `MARKETING` |
| 4 | 2단계 인증(MFA) | `MFA_SETUP` (또는 `TWO_FACTOR_AUTH`) |

- `AdminAccountCreateRequest`에 `termsAgreements[]` 추가 후 `handleAdminRegisterSubmit` 연동

#### 학교 — BE·UI 요청

- 등록 화면에 약관 섹션 **없음** — 기관 등록 정책 확정 시 UI 추가 + `pre-register/school` body 연동
- OpenAPI에 `termsAgreements?`는 이미 존재

#### 상세 조회 · `consent-records` (잔여 P0)

- pre-register `termsAgreements` → `GET …/consent-records` **저장·조회** round-trip
- **`InstructorMemberDetailResponse.termsAgreements[]` 추가** (개인 상세와 동일) — 또는 consent-records만으로 8건 보장
- `consentType` enum ↔ 위 canonical `termsType` **1:1 매핑** OpenAPI 명시 (alias 허용 시 매핑표 문서화)
- 동의서 작성형 — `formResponseId`·증빙 파일(성범죄 경력 조회 업로드)·관리자 대리 작성 API (전문 보관)
- FE 동의서 작성 UI(2026-08-06): 교육진행자 서약 default 동의 · 행정정보 식별번호 필수 · 성범죄 문서 업로드 — **제출 payload는 여전히 `agreed`만**


### 3.5 강사 소속 · 학교↔교사 매핑 (P0)

#### CMS 등록 vs BE 스키마 (2026-08-06)

| CMS UI (교사 회원) | FE pre-register (2026-08-06) | OpenAPI body | 상세 GET |
|--------------------|------------------------------|--------------|----------|
| 소속 학교명 (`schoolName`) **필수** | `profile.affiliation.schoolName` + legacy flat 없음 | **미정의** | **필드 없음** |
| 재직 현황 (`employmentStatus`) | `profile.affiliation.employmentStatus` | **미정의** | **필드 없음** |
| 일반 강사 소속 | `profile.affiliation.organizationNames[]` | **미정의** | **필드 없음** |
| 회원 유형 | `profile.memberType` + `instructorType` | `instructorType` ✅ | `primaryActivityType` ✅ |
| 기관 memberId | `profile.affiliation.affiliatedSchoolUserId` (선택) | **미정의** | **없음** |

- OpenAPI `AdminPreRegisterInstructorRequest` · `InstructorMemberDetailResponse`에 **`profile` 블록 없음** — §3.8 shape로 흡수 요청
- FE `map-pre-register-request.ts`: `body.profile` + `buildLegacyFlatFieldsFromCmsProfile()` 로 **legacy 6필드 병행 전송**(BE 마이그레이션용)
- 상세 `map-member-detail-to-user.ts`: response에 `profile`/`settlement` **loose parse** — BE 미반환 시 legacy `instructorProfile` flat으로 merge

#### 증상 (CMS)

| 화면·기능 | 기대 | 현재 (API 갭) |
|-----------|------|----------------|
| 강사 상세 — **소속** / **소속 \| 강사 경력** | 등록한 학교명·재직 | `-` 또는 빈 값 (`affiliatedSchoolName`·`employmentStatusLabel` 미수신) |
| `instructorMemberProfile` | `school_teacher` + 소속 데이터 | `primaryActivityType`만으로 **`school_teacher` 분기** — **표시 데이터 없음** |
| 학교(기관) 상세 — **소속 교사** | 등록 교사 행·연락처·재직 | `GET …/affiliated-teachers` — **affiliation 미저장 시 목록 비거나 링크 불완전** |
| 학교 → 교사 drill-down | 상세 API에 기관 연결 | `affiliatedSchoolUserId` 없음 → FE가 **학교 drawer 컨텍스트 힌트**로만 보강 (`user-list-page.tsx`) |
| 교사 상세 URL 복원 | `affiliatedSchoolName` 등 | 새로고침 시 **학교명·프로필 유실** 가능 |

#### BE 요청

1. **pre-register** — 교사(`SCHOOL_TEACHER`) 등록 시 수신·저장:
   - `affiliatedSchoolName` (또는 `schoolName`)
   - `employmentStatus` (`ACTIVE` / `ON_LEAVE` / `RESIGNED` 등 enum)
   - 선택: `affiliatedSchoolMemberId` · NEIS 코드로 **기관 member와 affiliation row 생성**
2. **상세 GET** (`InstructorMemberDetailResponse` / `instructorProfile`) — round-trip:
   - `affiliation`, `affiliatedSchoolName`, `employmentStatus`
   - `affiliatedSchoolUserId`(uuid) 또는 `affiliatedSchoolMemberId`
3. **목록 row** (`UserListRow` / member list item) — 동일 필드 반환 (목록 merge·URL 복원용)
4. **학교↔교사 affiliation API** — 강사 pre-register 완료 시 `GET …/users/{schoolMemberId}/affiliated-teachers`에 **교사 memberId·teacherMemberId·재직** 반영
5. OpenAPI — `InstructorDetailResponse`·pre-register DTO에 필드 추가 · 마스킹 정책(학교명 공개 여부) 명시

#### FE (BE 반영 전 · 2026-08-06)

| 항목 | 조치 |
|------|------|
| pre-register body | ✅ `profile` + `settlement` + legacy flat 병행 전송 |
| 상세 PATCH | ✅ `map-patch-user-basic-info.ts` — `profile`/`settlement` extended body |
| 상세 매핑 | ✅ `map-member-detail-to-user.ts` — loose `profile`/`settlement` 수신 · legacy merge |
| 이력서 탭 | ✅ `user-to-applicant-instructor-row.ts` — cms profile 우선 (학력·경력·수상·자유작성 1~4) |
| drill-down | `affiliated-teachers` BE 연동 전까지 학교 컨텍스트 힌트 유지 |

### 3.6 기타 (P1)

| 항목 | 마스킹 / unmask 관측 | BE 요청 |
|------|------------------------|---------|
| `accountHolder` | unmask 후에도 **`null`** (루트·`bankAccounts[]`) | FE **`settlement.accountHolder` 전송(2026-08-06)** · BE 수신·저장·unmask round-trip |
| `educationLevel` | unmask: `college4 / graduated` **코드 문자열** | 저장·반환 **코드 vs 한글 라벨** 정책 · 또는 `educations[]` |
| `defaultFeeGrade` | `null` | 강사비 등급 설정 API와 연동 (`instructorProfile.status`와 **혼동 금지**) |
| `certifications[]` | `[]` (미전송) | 전송 시 non-empty round-trip |

### 3.7 자유작성 1~4 · 구조화 이력서 — **§3.8 `profile`로 흡수** (P0)

> **2026-08-06:** FE는 등록·상세·PATCH에서 §3.8 `profile.essays` · `profile.education` · `profile.career` 등 **전 필드 전송**.  
> OpenAPI·BE 저장 없으면 **입력값 유실** — §3.8 OpenAPI가 본 항목의 실질 요청.

#### CMS 등록 폼 vs 현재 OpenAPI (2026-08-06)

| CMS UI | FE pre-register (`profile`) | OpenAPI flat | BE GET |
|--------|----------------------------|--------------|--------|
| 자유작성 1 | `essays.freeWrite1` + legacy `selfIntroduction` | `selfIntroduction` | flat만(마스킹 이슈 §3.2) |
| 자유작성 2~4 | `essays.freeWrite2~4` | **없음** | **없음** |
| 강사 경력(기본정보) | `instructorCareerSummary` + legacy `careerText` | `careerText` | flat만 |
| 구조화 학력 rows | `education.*` | `educationLevel` 요약만 | flat만 |
| 경력 rows | `career.rows[]` · `career.level` | **없음** | **없음** |
| JA 활동 | `jaKoreaActivities[]` | **없음** | **없음** |
| 수상 | `awards[]` | **없음** | **없음** |
| 자격증 | `licenses[]` + root `certifications[]` | `certifications[]` | `certifications[]` |

#### FE (2026-08-06 완료)

- `user-to-applicant-instructor-row.ts`: cms profile 우선 · `careerText`→freeWrite2 **혼입 제거**
- API 미연동 필드: BE `profile` 미반환 시 **빈칸** (mock 샘플 제거)
- `instructor-resume-blocks.tsx`: 경력 `new` → 「신입」 · 학력 다건 rows

#### BE 요청

- §3.8 `InstructorCmsProfile` 수락 — **Option A/B는 §3.8.2 표 채택** (개별 nested 필드)
- legacy flat 6필드 — **읽기 호환 1 release** (`buildLegacyFlatFieldsFromCmsProfile` 역변환 기준)

### 3.8 CMS 화면 기준 강사 프로필 구조체 (**FE 연동 완료 · BE OpenAPI P0**)

**목적:** 등록 모달·상세 기본정보·이력서 탭과 **1:1** 대응하는 OpenAPI DTO.  
기존 `instructorProfile.{careerText, selfIntroduction, educationLevel, …}` flat 키는 **deprecated** → `profile.*` + `settlement.*` 중첩으로 이전.

**FE 타입 (codegen 전 SSOT):**  
`apps/cms/src/features/user/api/types/instructor-cms-profile-proposal.ts`  
**FE mapper:** `apps/cms/src/features/user/api/map-instructor-cms-profile.ts`  
**FE 폼 SSOT:** `InstructorRegisterModalFormValues` (`instructor-profile-form-model.ts`)

#### FE 연동 상태 (2026-08-06)

| 경로 | `profile` | `settlement` | legacy flat |
|------|-----------|--------------|-------------|
| `POST …/pre-register/instructor` | ✅ 전송 | ✅ 전송 | ✅ 병행 (`educationLevel` 등) |
| `GET …/users/{memberId}/instructor` | ⚠️ loose parse (BE 미반환 시 legacy merge) | ⚠️ 동일 | ✅ 수신 |
| PATCH 상세 수정 | ✅ `map-patch-user-basic-info.ts` | ✅ 동일 | ✅ 병행 |
| OpenAPI codegen | ❌ extended type only | ❌ | ✅ generated |

#### 3.8.1 최상위 — `InstructorMemberDetailResponse` (개정안)

```json
{
  "member": { "memberId": 2, "name": "김강사", "email": "ins***@test.com", "phone": "010-****-5124" },
  "profile": { "$ref": "InstructorCmsProfile" },
  "settlement": { "$ref": "InstructorCmsSettlement" },
  "certifications": [{ "certificationName": "평생교육사 2급", "issuer": "교육부", "issuedDate": "2020-03-01" }]
}
```

| 블록 | CMS 화면 영역 | 비고 |
|------|---------------|------|
| `member` | 기본정보 — 성명·연락처·성별·생년월일 | 기존 `MemberDetailResponse` 유지 |
| `profile` | 회원 유형·소속·강사 경력·한 줄 소개·주소·**학력/경력/자유작성 전체** | **신규 중첩** |
| `settlement` | 정산 계좌·사업소득자 | 기존 root `bankName` 등 이동 |
| `certifications` | 자격 및 면허 | `profile.licenses`와 **동일 데이터** 허용(호환) |

#### 3.8.2 `InstructorCmsProfile` — 섹션별 필드

##### A. 기본정보 (`DetailInfoForm` 상단)

| CMS 라벨 | 제안 JSON path | FE form key | legacy API |
|----------|----------------|-------------|------------|
| 회원 유형 | `profile.memberType` | `memberType` | `primaryActivityType` / `instructorType` |
| 소속 (교사) | `profile.affiliation.schoolName` | `schoolName` | *(없음 — §3.5)* |
| 재직 현황 | `profile.affiliation.employmentStatus` | `employmentStatus` | *(없음 — §3.5)* |
| 소속 (일반) | `profile.affiliation.organizationNames[]` | `affiliationName` | `affiliation` (문자열) |
| 강사 경력 | `profile.instructorCareerSummary` | `instructorCareer` | `careerText` |
| 한 줄 소개 | `profile.oneLineIntro` | `oneLineIntro` | `oneLineIntro` |
| 자택 주소지 | `profile.homeAddress.line` / `.detail` | `homeAddress` / `homeAddressDetail` | `homeAddress` / `homeAddressDetail` |
| 사업소득자 | `settlement.businessIncome` | `isBusinessIncome` | `businessIncomeYn` |

##### B. 학력사항 (`instructor-register-education-section`)

| CMS UI | 제안 JSON path | FE form key |
|--------|----------------|-------------|
| 최종 학력 — 학교 구분 | `profile.education.highestSchoolType` | `eduSchoolType` |
| 최종 학력 — 상태 | `profile.education.highestStatus` | `eduStatus` |
| 학력 상세 체크 | `profile.education.detailKeys[]` | `educationDetailKeys` |
| 고등학교 row | `profile.education.highSchool` | `highSchool` |
| 2·3년제 rows | `profile.education.college23[]` | `college23Rows` |
| 4년제 rows | `profile.education.college4[]` | `college4Rows` |
| 대학원 rows | `profile.education.graduate[]` | `graduateRows` |

- legacy `educationLevel: "college4 / graduated"` → **`highestSchoolType` + `highestStatus`** 로 분리 저장 (요약 문자열 **deprecated**)

##### C. 경력사항

| CMS UI | 제안 JSON path | FE form key |
|--------|----------------|-------------|
| 경력 구분 | `profile.career.level` | `careerLevel` |
| 경력 rows | `profile.career.rows[]` | `careers` |
| (기본정보) 강사 경력 요약 | `profile.career.summaryYears` **또는** `profile.instructorCareerSummary` | `instructorCareer` |

##### D. 활동·자격·수상·자유작성

| CMS UI | 제안 JSON path | FE form key | legacy |
|--------|----------------|-------------|--------|
| JA 활동 이력 | `profile.jaKoreaActivities[]` | `jaKoreaRows` | — |
| 자격 및 면허 | `profile.licenses[]` | `licenseRows` | `certifications[]` |
| 수상 및 수료 | `profile.awards[]` | `awardRows` | — |
| 자유작성 1 | `profile.essays.freeWrite1` | `freeWrite1` | `selfIntroduction` |
| 자유작성 2~4 | `profile.essays.freeWrite2~4` | `freeWrite2~4` | — |

#### 3.8.3 JSON 예시 (등록 직후 GET — **마스킹 GET, 공개 필드 원문**)

```json
{
  "member": {
    "memberId": 2,
    "uuid": "2d1336e0-ba8c-47f0-8753-96719151cc66",
    "name": "김강사",
    "email": "ins***@test.com",
    "phone": "010-****-5124",
    "gender": "F",
    "birthDate": "1997-07-21",
    "roles": ["GENERAL", "INSTRUCTOR"]
  },
  "profile": {
    "memberType": "SCHOOL_TEACHER",
    "status": "APPROVED",
    "affiliation": {
      "schoolName": "OO초등학교",
      "employmentStatus": "ACTIVE",
      "organizationNames": []
    },
    "instructorCareerSummary": "10",
    "oneLineIntro": "뀨",
    "homeAddress": {
      "line": "경기도 고양시 덕양구",
      "detail": null
    },
    "education": {
      "highestSchoolType": "college4",
      "highestStatus": "graduated",
      "detailKeys": ["high", "college4"],
      "highSchool": { "schoolName": "OO고등학교", "gradYear": "2015-02" },
      "college4": [{ "schoolName": "OO대학교", "major": "경제학", "gradYear": "2019-02" }]
    },
    "career": {
      "level": "experienced",
      "summaryYears": "10",
      "rows": [
        {
          "companyName": "JA Korea",
          "roleName": "강사",
          "periodStart": "2020-03",
          "currentlyEmployed": true
        }
      ]
    },
    "jaKoreaActivities": [],
    "licenses": [],
    "awards": [],
    "essays": {
      "freeWrite1": "ㅋㅋ",
      "freeWrite2": "",
      "freeWrite3": "",
      "freeWrite4": ""
    },
    "defaultFeeGrade": null,
    "defaultJaGrade": null
  },
  "settlement": {
    "bankName": "우리은행",
    "accountNumber": "*************",
    "accountHolder": "김**",
    "businessIncome": false
  },
  "certifications": []
}
```

#### 3.8.4 마스킹 정책 (§5.1 · §3.2 연동)

| `profile` / `settlement` 필드 | 마스킹 GET | unmask |
|-------------------------------|------------|--------|
| `instructorCareerSummary`, `oneLineIntro`, `essays.*`, `education.*`, `career.*`, `jaKoreaActivities`, `licenses`, `awards` | **원문** (PII 아님) | 동일 |
| `homeAddress.line` | 시·군·구 (+ 정책 범위) | 원문 |
| `homeAddress.detail` | placeholder 또는 null | 원문 |
| `settlement.accountNumber`, `accountHolder` | 마스킹 | 원문 |
| `member.email`, `member.phone` | 마스킹 | 원문 |
| `education.*.schoolName` (학교명) | §1.2 학교명 마스킹 (`**대학교`) | 원문 |

#### 3.8.5 pre-register · PATCH

- `POST …/pre-register/instructor` body: **`profile` + `settlement` + `member` identity** — FE **이미 전송(2026-08-06)**
- `PATCH …/users/{memberId}/instructor` (또는 basic-info): **`profile` partial update** — FE **이미 전송**
- **마이그레이션:** 기존 flat `instructorProfile` **6개월 병행** 후 deprecated (BE 일정 협의)
- BE는 수신 시 **legacy flat + `profile` 동시 수신** 가능 — `profile` 우선 저장 권장

#### 3.8.6 BE 수락 기준 (2026-08-06)

- [ ] OpenAPI `InstructorCmsProfile` · `InstructorCmsSettlement` 스키마 등록 · **Orval codegen**
- [ ] `AdminPreRegisterInstructorRequest`에 `profile?` · `settlement?` 추가
- [ ] `InstructorMemberDetailResponse`에 `profile` · `settlement` · (선택) `termsAgreements` 추가
- [ ] GET `…/instructor` 가 §3.8.3 shape 반환 (공개 필드 **마스킹 GET 원문** §3.2)
- [ ] pre-register · PATCH round-trip — 등록 폼 **전 필드** (§3.8.2 표) 저장·재조회
- [ ] legacy `careerText`/`selfIntroduction`/`educationLevel`/`oneLineIntro` — **읽기 호환 1 release** 또는 migration script

---

## 4. FE 대응

| 항목 | 2026-07-31 | 2026-08-06 |
|------|------------|------------|
| §3.8 `profile`/`settlement` | 제안만 | ✅ 등록·상세·PATCH · legacy flat 병행 |
| 마스킹 placeholder | `"마스킹"` → `-` | ✅ 유지 |
| `educationLevel` 코드 | 한글 변환 | ✅ 유지 |
| 자유작성 2~4 · 구조화 이력서 | 빈칸 | ✅ `profile` 전송 · BE 미반환 시 빈칸 |
| 소속 학교·재직 | BE 대기 | ✅ `profile.affiliation` 전송 · BE 대기 |
| 약관 8건 | pre-register 전송 | ✅ + `map-member-consent-records` · canonical `termsType` |
| 동의서 작성 UI | — | ✅ default 동의·식별번호 필수·업로드 UX (payload `agreed`만) |
| 상세 API 호출 | 다수 GET | ✅ PATCH 후 `getUserById` 생략 · list invalidate 축소 |
| unmask 연동 | 원문 반영 | ✅ 유지 |
| codegen | — | ⏳ BE OpenAPI `profile`/`settlement` 반영 후 extended type 제거 |

---

## 5. BE 회신 부탁 (2026-08-06)

1. **§3.8 `InstructorCmsProfile` / `InstructorCmsSettlement`** — OpenAPI 등록 · pre-register·GET·PATCH round-trip (**FE 전송 완료 · BE 최우선**)
2. **§3.2 강사 프로필 공개 필드** — 마스킹 GET 원문 · OpenAPI CMS 라벨 매핑
3. **§3.5 강사 소속** — `profile.affiliation` 저장 · `affiliated-teachers`
4. **§3.4 등록 약관** — `termsAgreements`→`consent-records` · 강사 상세 `termsAgreements?` · `consentType`↔`termsType` alias 표
5. **§3.4 동의서 작성형** — `formResponseId` · 성범죄 경력 조회 증빙 파일 API
6. §3.1 **마스킹 GET** — `homeAddressDetail` `null` vs placeholder · `homeAddress` truncation
7. §3.3 unmask 응답 shape OpenAPI 반영
8. §3.6 `accountHolder` round-trip (`settlement.accountHolder` FE 전송 중)
9. **unmask `reason` minLength 1** · **API 에러 사용자 문구** — [members handoff §2.7](./members-api-backend-handoff-2026-07-31.md#27-unmask-reason-길이-제한-p0--2026-07-31-관측) · [backend-handoff §에러 응답](../backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통)

**Last updated:** 2026-08-06 (§3.0 우선순위 · §3.8 FE 연동 완료 · §3.4 canonical termsType · §3.5/§3.7 profile 전송 · 동의서 UI · [openapi-mismatch](./instructor-register-ui-openapi-mismatch-2026-08-06.md) 교차 참조)
