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
  "_cmsFormNote": "교사 회원 등록 UI는 schoolName·employmentStatus(재직)를 수집하나, 아래 JSON에는 affiliation/schoolName 필드가 없음 — §3.4",
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
  "accountHolder": null,
  "bankAccounts": [{ "bankName": "우리은행", "accountNumber": "*************", "current": true }],
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
| `oneLineIntro` | `뀨` | `"마스킹"` | `뀨` | ✅ (placeholder 정책) |
| `careerText` | `10` | `"마스킹"` | `10` | ✅ |
| `selfIntroduction` | `ㅋㅋ` | `"마스킹"` | `ㅋㅋ` | ✅ |
| `educationLevel` | `college4 / graduated` | `"마스킹"` | `college4 / graduated` | ✅ unmask · 코드 형식 정책 별도 |
| `accountNumber` | `1002859723089` | `*************` | `1002859723089` | ✅ |
| `accountHolder` | (미전송) | `null` | **`null`** | ❌ unmask 후에도 null |
| `defaultFeeGrade` | — | `null` | `null` | — (미설정) |
| `instructorProfile.status` | — | `APPROVED` | `APPROVED` | ✅ (강사비 등급과 **별도**) |
| 소속 학교명 (`schoolName`) | CMS 폼 입력 | **없음** | **없음** | ❌ §3.4 |
| 재직 현황 (`employmentStatus`) | CMS 폼 입력 | **없음** | **없음** | ❌ §3.4 |
| `affiliatedSchoolUserId` (기관↔교사) | — | **없음** | **없음** | ❌ §3.4 · `affiliated-teachers` 연동 |

**요약:** DB 저장·unmask round-trip은 **대부분 정상**. 잔여 P0는 **마스킹 GET**(`homeAddress` truncation, `homeAddressDetail` null), **강사 소속·학교↔교사 매핑**(§3.4), **`accountHolder`**, **동의·스키마 확장** 쪽.

---

## 2. 반영 vs 미반영 요약

| 구분 | 등록 필드 | 마스킹 GET | unmask GET | CMS (2026-07-31) |
|------|-----------|------------|------------|------------------|
| ✅ | `email`, `phone` | 마스킹 | 원문 | 상세보기 전/후 |
| ✅ | `name`, `gender`, `birthDate` | 원문 | 원문 | 기본정보 |
| ✅ | `instructorType` | `primaryActivityType` | 동일 | `school_teacher` 레이아웃 **분기만** (소속 데이터는 §3.4) |
| ❌ | 소속 학교명 (`schoolName`) | **없음** | **없음** | 상세 **소속** 행 `-` |
| ❌ | 재직 현황 (`employmentStatus`) | **없음** | **없음** | 재직 배지·소속 `\|` 구분 미표시 |
| ❌ | `affiliation` (학교명 \| 재직) | **없음** | **없음** | pre-register **미전송** |
| ❌ | `affiliatedSchoolUserId` | **없음** | **없음** | 학교↔교사 **양방향 링크 불가** |
| ❌ | 학교↔교사 affiliation | — | — | `GET …/affiliated-teachers` **미연결** |
| ✅ | `businessIncome` | `businessIncomeYn` | 동일 | 사업소득자 |
| ✅ | `bankName`, `accountNumber` | 마스킹 | 원문 | 정산 계좌 |
| ⚠️ | `homeAddress` | **시·군·구만** | **원문** | unmask 후 전체 노출 |
| ⚠️ | `homeAddressDetail` | **`null`** | **원문** | unmask 후 상세 input 분리 |
| ✅ | `oneLineIntro`, `careerText`, `selfIntroduction`, `educationLevel` | `"마스킹"` | **원문** | unmask 후 표시 |
| ⚠️ | `educationLevel` 형식 | — | `college4 / graduated` 코드 | FE 한글 라벨 변환 |
| ❌ | `accountHolder` | `null` | **`null`** | 예금주 미저장 |
| ❌ | `termsAgreements` | 상세 본문 없음 | — | `consent-records` · **등록 8건 FE 전송(2026-07-31)** |
| ❌ | 동의서 작성형 5종 | 미전송 | — | BE API 필요 |
| — | `certifications` | `[]` | `[]` | 미전송 시 정상 |
| — | 구조화 학력·경력 | 스키마 없음 | — | 요약만 |
| ❌ | 자유작성 2~4 | 필드 없음 | — | FE: 빈칸 |
| ✅ | 자유작성 1 | `"마스킹"` | `selfIntroduction` | 1번만 연동 |

---

## 3. BE 수정 요청

> **2026-07-31 재관측:** unmask 후 `homeAddressDetail`·소개·경력·학력·계좌번호 등 **등록 원문 round-trip 확인됨**.  
> 아래 P0는 **마스킹 GET 정책**·**강사 소속·학교↔교사 매핑(§3.4)** ·**accountHolder**·**동의/스키마** 등 **잔여** 항목.

### 3.1 자택 주소 — **마스킹 GET** (P0)

| 필드 | unmask GET (확인됨) | 마스킹 GET (문제) | BE 요청 |
|------|---------------------|-------------------|---------|
| `homeAddress` | `경기도 고양시 덕양구 무원로 1 (행신동)` ✅ | `경기도 고양시 덕양구` only | 마스킹 GET도 **시·군·구 + 정책상 허용 범위** 일관 적용 · OpenAPI 명시 |
| `homeAddressDetail` | `현소네` ✅ | **`null`** | 마스킹 GET에서 **`null` 대신** 마스킹 placeholder(예: `"마스킹"`) 또는 시·군·구와 분리된 마스킹 값 반환 |

- **저장·unmask:** ✅ 정상 — §1.3·§1.4
- **수정 대상:** 마스킹 GET만 (상세보기 **전** CMS 자택 주소·상세 주소 표시)

### 3.2 PII 마스킹 · unmask — **unmask ✅ / OpenAPI 문서화** (P1)

| 필드 | 마스킹 GET | unmask GET (2026-07-31 확인) |
|------|------------|------------------------------|
| `oneLineIntro` | `"마스킹"` | `뀨` ✅ |
| `careerText` | `"마스킹"` | `10` ✅ |
| `selfIntroduction` | `"마스킹"` | `ㅋㅋ` ✅ |
| `educationLevel` | `"마스킹"` | `college4 / graduated` ✅ |
| `member.email` / `phone` | 마스킹 | 원문 ✅ |
| `accountNumber` | `*` 마스킹 | 원문 ✅ |

**BE 요청 (잔여):**

1. placeholder 리터럴 `"마스킹"` — OpenAPI·역할별 마스킹 단위 표에 **명시** (§1.2·§1.3 패턴 확정)
2. unmask 응답 DTO = `InstructorMemberDetailResponse` 와 **동일 shape** 문서화 (별도 DTO vs GET 재조회)

### 3.3 관리자 등록 — 약관·동의 (P0)

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


### 3.4 강사 소속 · 학교↔교사 매핑 (P0)

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

### 3.5 기타 (P1)

| 항목 | 마스킹 / unmask 관측 | BE 요청 |
|------|------------------------|---------|
| `accountHolder` | 등록 미전송 · unmask 후에도 **`null`** (루트·`bankAccounts[]`) | pre-register `accountHolder` 수신·저장 · unmask round-trip · CMS는 `accountHolder` 또는 예금주명 전송 예정 |
| `educationLevel` | unmask: `college4 / graduated` **코드 문자열** | 저장·반환 **코드 vs 한글 라벨** 정책 · 또는 `educations[]` |
| `defaultFeeGrade` | `null` | 강사비 등급 설정 API와 연동 (`instructorProfile.status`와 **혼동 금지**) |
| `certifications[]` | `[]` (미전송) | 전송 시 non-empty round-trip |

### 3.6 자유작성 1~4 (P1) — **현재 BE 필드 1개뿐**

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
| 소속·재직 | loose / 미전송 | **`§3.4 P0`** — `affiliation`, `affiliatedSchoolName`, `employmentStatus`, `affiliated-teachers` |

---

## 4. FE 대응 (2026-07-31)

| 항목 | 조치 |
|------|------|
| 마스킹 placeholder | `"마스킹"` 값을 `-` 대신 상세·이력서에 표시 |
| `educationLevel` 코드 | `college4 / graduated` → `대학교 4년제 / 졸업` 표시 |
| `school_teacher` 프로필 | API 연동 필드(학력 요약·자유작성 1 등) 이력서 섹션 노출 · **소속 학교명·재직은 §3.4 BE 대기** |
| 학교↔교사 drill-down | API `affiliatedSchoolUserId` 없을 때 **학교 drawer 힌트**로 프로필·학교명 보강 (임시) |
| 자택 주소 수정 모드 | `homeAddress` / `homeAddressDetail` 분리 표시 |
| **자유작성 2~4** | API 없으면 **빈칸** · `careerText` 혼입·mock 제거 |
| unmask 연동 | unmask 응답 원문 → 상세·수정 폼 반영 (§1.3 필드) |
| **약관 등록 연동** | 강사·개인 **8건** `termsAgreements` pre-register 전송 · 학교 UI 없음 · 관리자 BE 스키마 대기 |
| 동의 탭 | `consent-records` 연동 · BE `termsAgreements`→records round-trip 대기 |

---

## 5. BE 회신 부탁

1. §3.1 **마스킹 GET** — `homeAddressDetail` `null` vs placeholder · `homeAddress` truncation 정책 확정
2. §3.2 unmask 응답 shape · `"마스킹"` placeholder OpenAPI 반영 (unmask round-trip은 §1.4 **확인됨**)
3. §3.3 **등록 약관** — 역할별 화면 건수·`termsAgreements` round-trip · `consent-records` · 관리자 create 스키마 · 동의서 `formResponseId`
4. **§3.4 강사 소속** — `affiliatedSchoolName` · `employmentStatus` · `affiliatedSchoolUserId` pre-register/GET/목록 round-trip · **`affiliated-teachers` affiliation 생성** 정책
5. §3.5 `accountHolder` · `educationLevel` 코드 형식 · `defaultFeeGrade` 설정 path
6. §3.6 자유작성 2~4 — Option A vs B · pre-register/GET/PATCH ETA

**Last updated:** 2026-07-31 (§3.3 등록 약관 역할별·FE 8건 연동 · §3.4 강사 소속)
