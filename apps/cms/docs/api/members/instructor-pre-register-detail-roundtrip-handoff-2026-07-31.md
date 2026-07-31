# 강사 사전등록 ↔ 상세조회 round-trip — 미반영·관측 갭

**작성일:** 2026-07-31  
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

- 등록: `instructor-register-modal.tsx` · `user-list-page.tsx` · `map-pre-register-request.ts` · `map-instructor-register-extras.ts`
- 상세: `map-member-detail-to-user.ts` · `user-basic-info/display.ts` · `user-to-applicant-instructor-row.ts` · `user-detail-fullpage-basic-tab-content.tsx`

**선행 문서:** [members-pre-register-handover-2026-07-28.md](./members-pre-register-handover-2026-07-28.md) §C

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
| ❌ | 소속 학교명 (`schoolName`) | **없음** | **없음** | 상세 **소속** 행 `-` |
| ❌ | 재직 현황 (`employmentStatus`) | **없음** | **없음** | 재직 배지·소속 `\|` 구분 미표시 |
| ❌ | `affiliation` (학교명 \| 재직) | **없음** | **없음** | pre-register **미전송** |
| ❌ | `affiliatedSchoolUserId` | **없음** | **없음** | 학교↔교사 **양방향 링크 불가** |
| ❌ | 학교↔교사 affiliation | — | — | `GET …/affiliated-teachers` **미연결** |
| ✅ | `businessIncome` | `businessIncomeYn` | 동일 | 사업소득자 |
| ✅ | `bankName`, `accountNumber` | 마스킹 | 원문 | 정산 계좌 |
| ⚠️ | `homeAddress` | **시·군·구만** | **원문** | unmask 후 전체 노출 |
| ⚠️ | `homeAddressDetail` | **`null`** | **원문** | unmask 후 상세 input 분리 |
| ❌ | `oneLineIntro`, `careerText`, `selfIntroduction`, `educationLevel` | **`"마스킹"` (오적용)** | **원문** | FE: placeholder → `-` · **BE §3.2** · **필드명↔화면 §3.2 표** |
| ⚠️ | `educationLevel` 형식 | — | `college4 / graduated` 코드 | FE 한글 라벨 변환 |
| ❌ | `accountHolder` | `null` | **`null`** | 예금주 미저장 |
| ❌ | `termsAgreements` | 상세 본문 없음 | — | `consent-records` · **등록 8건 FE 전송(2026-07-31)** |
| ❌ | 동의서 작성형 5종 | 미전송 | — | BE API 필요 |
| — | `certifications` | `[]` | `[]` | 미전송 시 정상 |
| — | 구조화 학력·경력 | 스키마 없음 | — | 요약만 |
| ❌ | 자유작성 2~4 | 필드 없음 | — | FE: 빈칸 |
| ❌ | 자유작성 1 (`selfIntroduction`) | **`"마스킹"` (오적용)** | `selfIntroduction` | §3.2 · **한 줄 소개(`oneLineIntro`)와 별도** |

---

## 3. BE 수정 요청

> **2026-07-31 재관측:** unmask 후 `homeAddressDetail`·소개·경력·학력·계좌번호 등 **등록 원문 round-trip 확인됨**.  
> 아래 P0는 **마스킹 GET 정책 오적용(§3.2)** · **마스킹 GET 주소(§3.1)** · **강사 소속·학교↔교사 매핑(§3.5)** · **accountHolder** · **동의/스키마** 등 **잔여** 항목.

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
| 5 | 지급조서 | 동의서 작성 | `PAYMENT_STATEMENT` | 동일 |
| 6 | 교육진행자 서약 | 동의서 작성 | `EDUCATOR_PLEDGE` | 동일 |
| 7 | 행정정보 공동이용 | 동의서 작성 | `ADMINISTRATIVE_JOINT` | 동일 |
| 8 | 성범죄 경력 조회 | 동의서 작성 | `SEX_OFFENSE_CHECK` | 동일 |

- FE: `apps/cms/src/features/user/api/build-pre-register-terms-agreements.ts`
- 동의서 작성형은 **`agreed: true`만** 전송 — `formResponseId`·전문 스냅샷은 **BE API 확정 후** 추가

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
- `consentType` enum ↔ 위 `termsType` **1:1 매핑** OpenAPI 명시
- 동의서 작성형 — `formResponseId`·증빙 파일·관리자 대리 작성 API (전문 보관)


### 3.5 강사 소속 · 학교↔교사 매핑 (P0)

#### CMS 등록 vs BE 스키마 (2026-07-31 관측)

| CMS UI (교사 회원) | FE `createUser` | `POST …/pre-register/instructor` | 상세 GET §1.2·§1.3 |
|--------------------|-----------------|-----------------------------------|---------------------|
| 소속 학교명 (`schoolName`) **필수** | `affiliation` 문자열 일부 | **미전송** | **필드 없음** |
| 재직 현황 (`employmentStatus`) | `affiliation`에 `\|` 결합 | **미전송** | **필드 없음** |
| 회원 유형 | `instructorType: SCHOOL_TEACHER` | ✅ 전송 | `primaryActivityType: SCHOOL_TEACHER` ✅ |
| 기관 memberId / uuid | — | **없음** | **`affiliatedSchoolUserId` 없음** |

- OpenAPI `AdminPreRegisterInstructorRequest` · `InstructorDetailResponse`에 **`affiliation` / `affiliatedSchoolName` / `employmentStatus` / `affiliatedSchoolUserId`(또는 `affiliatedSchoolMemberId`) 없음**
- FE `map-pre-register-request.ts`는 위 소속 필드를 body에 **넣지 않음** (폼에서 모아도 API로 **드롭**)

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

#### FE (BE 반영 전 · 임시)

| 항목 | 조치 |
|------|------|
| pre-register body | BE 스키마 확정 후 `schoolName`/`employmentStatus`/`affiliation` **전송 추가** |
| 상세 매핑 | `map-member-detail-to-user.ts` — loose 필드 수신 시 이미 매핑 준비됨 (§ 테스트 `affiliatedSchoolName`) |
| drill-down | `affiliated-teachers` BE 연동 전까지 학교 컨텍스트 힌트 유지 |

### 3.6 기타 (P1)

| 항목 | 마스킹 / unmask 관측 | BE 요청 |
|------|------------------------|---------|
| `accountHolder` | 등록 미전송 · unmask 후에도 **`null`** (루트·`bankAccounts[]`) | pre-register `accountHolder` 수신·저장 · unmask round-trip · CMS는 `accountHolder` 또는 예금주명 전송 예정 |
| `educationLevel` | unmask: `college4 / graduated` **코드 문자열** | 저장·반환 **코드 vs 한글 라벨** 정책 · 또는 `educations[]` |
| `defaultFeeGrade` | `null` | 강사비 등급 설정 API와 연동 (`instructorProfile.status`와 **혼동 금지**) |
| `certifications[]` | `[]` (미전송) | 전송 시 non-empty round-trip |

### 3.7 자유작성 1~4 (P1) — **현재 BE 필드 1개뿐**

#### CMS 등록 폼 vs OpenAPI

| CMS UI | pre-register body | 상세 GET (`instructorProfile`) | 비고 |
|--------|-------------------|-------------------------------|------|
| 자유작성 1 | `selfIntroduction` | `selfIntroduction` | ✅ 유일 연동 필드 |
| 자유작성 2 | **미전송** | **없음** | |
| 자유작성 3 | **미전송** | **없음** | |
| 자유작성 4 | **미전송** | **없음** | |
| 강사 경력(기본정보) | `careerText` | `careerText` | 자유작성과 **별도** — 2번에 섞지 말 것 |

#### FE 오동작 (2026-07-31 수정 전)

- `user-to-applicant-instructor-row.ts`가 `careerText`를 `freeWriting2`에 **잘못 매핑**
- API 미연동 시 **mock 샘플 문단**을 2~4번에 표시
- → **2026-07-31 FE 수정:** 2~4번은 API 필드 생기기 전까지 **항상 빈칸**, 1번만 `selfIntroduction`

#### BE 요청 (스키마 확장)

**Option A — 개별 필드 (FE mapper 단순)**

```json
{
  "selfIntroduction": "1번 원문",
  "freeWrite2": "2번 원문",
  "freeWrite3": "3번 원문",
  "freeWrite4": "4번 원문"
}
```

- `AdminPreRegisterInstructorRequest` · `InstructorDetailResponse` · PATCH(상세 수정) DTO에 추가
- 마스킹 GET / unmask 정책은 §3.2와 동일

**Option B — 배열**

```json
{
  "essays": [
    { "order": 1, "body": "..." },
    { "order": 2, "body": "..." }
  ]
}
```

#### 등록·상세·수정 path

| Method | Path | 필요 |
|--------|------|------|
| `POST` | `…/pre-register/instructor` | 2~4 필드 수신·저장 |
| `GET` | `…/users/{memberId}/instructor` | 2~4 반환 |
| `PATCH` | `…/users/{memberId}/instructor` (또는 profile PATCH) | CMS 상세 수정 저장 |

#### 구조화 이력서 (별도 P1 — handoff §C.3.2)

| CMS UI | 현재 API | BE 요청 |
|--------|----------|---------|
| 구조화 학력 rows | `educationLevel` 요약만 | `educations[]` |
| 경력 rows | `careerText`만 | `careerLevel` + `careers[]` |
| JA 활동 | 없음 | `jaKoreaActivities[]` |
| 수상 | 없음 | `awards[]` |
| 소속·재직 | loose / 미전송 | **`§3.5 P0`** — `affiliation`, `affiliatedSchoolName`, `employmentStatus`, `affiliated-teachers` |

> **통합 제안:** §3.7 Option A/B·위 표를 **`§3.8 CMS 화면 기준 강사 구조체`** 로 일원화. BE는 §3.8 shape 채택을 권장.

### 3.8 CMS 화면 기준 강사 프로필 구조체 (제안 · P0 스키마)

**목적:** 등록 모달·상세 기본정보·이력서 탭과 **1:1** 대응하는 OpenAPI DTO.  
기존 `instructorProfile.{careerText, selfIntroduction, educationLevel, …}` flat 키는 **deprecated** → `profile.*` 중첩으로 이전.

**FE 참조 타입 (codegen 전):**  
`apps/cms/src/features/user/api/types/instructor-cms-profile-proposal.ts`  
**FE 폼 SSOT:** `InstructorRegisterModalFormValues` (`instructor-profile-form-model.ts`)

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

- `POST …/pre-register/instructor` body: **`profile` + `settlement` + `member` identity** 동일 shape (비밀번호·약관 제외)
- `PATCH …/users/{memberId}/instructor`: **`profile` partial update** — CMS 상세 수정 모드와 동일 필드셋
- **마이그레이션:** 기존 flat `instructorProfile` 6개월 병행 후 deprecated (BE 일정 협의)

#### 3.8.6 BE 수락 기준

- [ ] OpenAPI `InstructorCmsProfile` 스키마 등록 · codegen
- [ ] GET `…/instructor` 가 §3.8.3 shape 반환 (공개 필드 **마스킹 GET 원문**)
- [ ] pre-register · PATCH round-trip — 등록 폼 **전 필드** (§3.8.2 표) 저장·재조회
- [ ] legacy `careerText`/`selfIntroduction`/`educationLevel` — **읽기 호환 1 release** 또는 migration script

---

## 4. FE 대응 (2026-07-31)

| 항목 | 조치 |
|------|------|
| 마스킹 placeholder | `"마스킹"` → state 미저장 · 화면 `-` (§3.2) |
| API↔화면 필드명 | §3.2 매핑표 SSOT · OpenAPI description에 CMS 라벨 기재 요청 |
| `educationLevel` 코드 | `college4 / graduated` → `대학교 4년제 / 졸업` 표시 |
| `school_teacher` 프로필 | API 연동 필드(학력 요약·자유작성 1 등) 이력서 섹션 노출 · **소속 학교명·재직은 §3.5 BE 대기** |
| 학교↔교사 drill-down | API `affiliatedSchoolUserId` 없을 때 **학교 drawer 힌트**로 프로필·학교명 보강 (임시) |
| 자택 주소 수정 모드 | `homeAddress` / `homeAddressDetail` 분리 표시 |
| **자유작성 2~4** | API 없으면 **빈칸** · `careerText` 혼입·mock 제거 |
| unmask 연동 | unmask 응답 원문 → 상세·수정 폼 반영 (§1.3 필드) |
| **약관 등록 연동** | 강사·개인 **8건** `termsAgreements` pre-register 전송 · 학교 UI 없음 · 관리자 BE 스키마 대기 |
| 동의 탭 | `consent-records` 연동 · BE `termsAgreements`→records round-trip 대기 |

---

## 5. BE 회신 부탁

1. §3.1 **마스킹 GET** — `homeAddressDetail` `null` vs placeholder · `homeAddress` truncation 정책 확정
2. **§3.2 강사 프로필 공개 필드** — 마스킹 GET 원문 · OpenAPI CMS 라벨 매핑
3. **§3.8 CMS 화면 기준 `InstructorCmsProfile` 스키마** — 등록·상세·PATCH 통합 DTO
4. §3.3 unmask 응답 shape OpenAPI 반영
5. §3.4 **등록 약관** — 역할별 round-trip
6. **§3.5 강사 소속** — `affiliation` nested · affiliated-teachers
7. §3.6 `accountHolder` · `defaultFeeGrade`
8. §3.7 자유작성 2~4 — §3.8 `profile.essays` 로 흡수
9. **unmask `reason` minLength 1** · **API 에러 사용자 문구** — [members handoff §2.7](./members-api-backend-handoff-2026-07-31.md#27-unmask-reason-길이-제한-p0--2026-07-31-관측) · [backend-handoff §에러 응답](../backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통)

**Last updated:** 2026-07-31 (§3.8 CMS 강사 구조체 · §3.2 마스킹·필드명 · §3.4 약관 · §3.5 소속 · unmask reason · 에러 메시지)
