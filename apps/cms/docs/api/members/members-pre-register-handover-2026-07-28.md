# Handover: CMS 회원 사전등록 — 학교 · 강사 · 임시 비밀번호 (통합)

**대상:** 백엔드 (+ FE 참고)  
**앱:** CMS (관리자) · Platform (비밀번호 UX)  
**일시:** 2026-07-28  
**도메인:** `members` · pre-register / 목록·상세 · `createAdmin`  
**범위:** 본 문서 **단독 전달** 가능 (path 분리·마스킹 정책 포함)

---

## 0. 한 페이지 요약

| 우선순위 | 역할 | 핵심 요청 |
|----------|------|-----------|
| **배경** | **§1** | 역할별 **등록·상세 API path** · **회원 정보 마스킹** (unmask) |
| **P0** | **공통** (§A) | 개인·강사 pre-register **`rawPassword`** · 관리자 `createAdmin` · **Platform 8자 비밀번호 정책 통일** · email = 임시 비밀번호 |
| **P0** | **학교** (§B) | `email` **optional** (더미 email 금지) · 목록에 `address` / `addressDetail` |
| **P0** | **강사** (§C) | 등록↔상세 **birthDate·자택 주소(시군구)·certifications** round-trip · §A `rawPassword` |
| **P1** | **강사** (§C) | 구조화 학력·경력·JA·수상·자유작성 2~4 · 소속·동의서 작성형 |
| **P2** | **강사** (§C) | `"마스킹"` 플레이스홀더 vs unmask 계약 |

**읽는 순서:** §1(배경) → §A~C(역할별 갭) → §D·§E(수락·회신).

---

## 1. 배경 계약 — API path · 마스킹

본 절은 **선행 문서 없이** BE가 path·마스킹 맥락을 파악하기 위한 SSOT입니다.

### 1.1 역할별 등록·상세 API (canonical — B안)

CMS는 kind별 모달(개인 / 학교 / 강사 / **관리자**)을 사용합니다.  
**관리자**는 pre-register가 아니라 **`admin-accounts`** 전용. 개인·학교·강사는 **역할별 path + DTO** 분리가 canonical입니다.  
단일 `POST /api/admin/users/pre-register` + body `role`만 추가(A안)는 **본 handoff에서 canonical 아님**.

| CMS kind | 등록 API | 상세 API | unmask (역할별) |
|----------|----------|----------|-----------------|
| 관리자 | `POST /api/admin/admin-accounts` (`createAdmin`) | `GET /api/admin/users?role=ADMIN` · `admin-accounts` | (관리자 전용 정책) |
| 개인 | `POST /api/admin/users/pre-register/individual` | `GET /api/admin/users/{memberId}/individual` | `POST …/individual/privacy/unmask` |
| 학교(기관) | `POST /api/admin/users/pre-register/school` | `GET /api/admin/users/{memberId}/school` | `POST …/privacy/unmask` (역할 전용 없을 때) |
| 강사 | `POST /api/admin/users/pre-register/instructor` | `GET /api/admin/users/{memberId}/instructor` | `POST …/instructor/privacy/unmask` |

**BE 추가 확인**

- kind별 등록 후 **해당 kind 목록**에서 1건 검색 가능할 것  
- **학교(기관) memberId**와 **소속 교사 memberId**·관리자 코멘트는 **별도 저장·조회** (동일 API 키 공유 금지)  
- `createAdmin` 응답·`GET …/users?role=ADMIN` 의 **`memberId` / `uuid` 정합** — 등록 직후 목록·상세·삭제 path 일치  
- 기존 단일 `POST /api/admin/users/pre-register` · `AdminPreRegisterMemberRequest` — **deprecated** 또는 individual 전용 한정 여부 BE 명시

### 1.2 회원 정보 마스킹 (목록·상세 GET · unmask)

| | |
|---|---|
| **FE 기본** | 마스킹된 값 표시 · 「개인정보 상세보기」 시 역할별 `…/privacy/unmask` 로 원문 (감사로그) |
| **BE 요청** | 아래 정책을 **목록·상세 GET 기본 응답**에 적용하거나 `masked*` / `displayLabel` 로 명시 · unmask 시에만 원문 |

| 항목 | 마스킹 | 표시 예시 · 비고 |
|------|--------|------------------|
| **회원명** | **하지 않음** | 원문 |
| **성별** | **하지 않음** | 원문 |
| **전화번호** | 가운데 **4자리** `*` | `010-****-5678` |
| **이메일** | `@` 앞 **앞 3글자** + `***` | `0915***@naver.com` |
| **주소 (자택)** | **동(읍·면)까지 노출**, 이후 상세는 블러 (별표 아님) | `강서구 화곡동` + tail blur · FE는 공백 기준 앞 2토큰 노출 후 blur |
| **주소 (기관)** | **해당 없음** | 학교·기관 소재지 — **마스킹·블러 미적용** (§B) |
| **계좌** | 은행명 제외 · 번호 전부 `*` · 예금주 **성만** | `농협 --**` / `박**` |
| **학력 — 학교명** | 학교명 마스킹 | `**대학교` |
| **1365 ID** | **뒤 3자리** `*` | `0915123***` |

**BE 확인 체크**

1. 목록 `GET /api/admin/users` — email·phone 등 기본 응답이 위 규칙과 일치  
2. 상세·`instructor-profile` · 계좌·학력·1365 — 필드별 마스킹/unmask  
3. **기관 주소** vs **자택 주소** 필드 분리 — 자택만 블러  
4. 역할별 상세 DTO(§1.1)에 동일 정책 반복 명시  

> **강사 자택 (§C.3.1.1):** 정책상 **동까지** 노출이 목표. 현재 **시(도)만** 반환되는 경우는 **버그** — 최소 **시·군·구**까지 내려줄 것. `homeAddress` / `homeAddressDetail` 분리 · unmask 시 도로명 전체 + detail.

---

## A. 공통 — 임시 비밀번호(`rawPassword`) · 비밀번호 정책

**정책:** 관리자가 등록해 주는 로그인 가능 회원은 **계정 아이디(email) = 임시 비밀번호**.

| Method | Path | 스키마 | 현황 |
|--------|------|--------|------|
| `POST` | `/api/admin/users/pre-register/individual` | `AdminPreRegisterIndividualRequest` | **`rawPassword` 없음** |
| `POST` | `/api/admin/users/pre-register/instructor` | `AdminPreRegisterInstructorRequest` | **`rawPassword` 없음** |
| `POST` | `/api/admin/admin-accounts` | `AdminAccountCreateRequest` | ✅ `rawPassword` 수용 — **12자 정책 불일치 (§A.4)** |
| `POST` | `/api/admin/users/pre-register/school` | `AdminPreRegisterSchoolRequest` | 기관은 로그인 email 미사용 — **본 절 대상 아님 (§B)** |

**관련 FE:**

- 규칙: `apps/cms/src/features/user/lib/admin-provisioned-temp-password.ts`
- `createUser`: `apps/cms/src/entities/user/api/user-service.ts` (email 있으면 password = email)
- 호출: 개인 `add-user-individual.tsx` · 강사/관리자 `user-list-page.tsx`
- 매핑: `map-pre-register-request.ts` — OpenAPI에 필드 생기면 `rawPassword` 전송 예정
- Platform 검증: `apps/platform/src/features/auth/sign-up/lib/utils.ts` → `isValidPassword`

### A.1 요약

- **관리자:** `createAdmin` → `rawPassword` 전송 중 (값 = email) — 서버 12자 정책으로 **실패 관측**
- **개인·강사:** FE는 동일 규칙이나 pre-register 스키마에 필드 없어 **미전송**
- **학교(기관):** 로그인 계정 없음 → §B

### A.2 요청 스키마

`AdminPreRegisterIndividualRequest` · `AdminPreRegisterInstructorRequest`에 추가:

| 필드 | 타입 | required | 설명 |
|------|------|----------|------|
| `rawPassword` | `string` | **yes** (로그인 계정 발급 시) | 초기 비밀번호. CMS는 **email과 동일 값** 전송 |

필드명은 관리자와 맞춰 **`rawPassword`** 권장.

### A.3 서버 동작

1. pre-register 시 `rawPassword`를 받아 **로그인 초기 비밀번호로 저장**(해시)
2. 계정 아이디는 `email`
3. 최초 로그인 비밀번호 변경 강제 여부는 문서화
4. OpenAPI 반영 후 FE `generate:api` → mapper 연결
5. 검증은 **§A.4 Platform 규칙**을 등록·변경 path에 동일 적용

**요청 예시:**

```json
{
  "email": "member@example.com",
  "rawPassword": "member@example.com",
  "name": "홍길동"
}
```

### A.4 비밀번호 정책 — Platform과 통일 (P0)

#### 관측 (CMS 관리자 신규 등록)

- API: `POST /api/admin/admin-accounts` (`createAdmin`)
- FE: `rawPassword` = 등록 email
- 응답 예: `{ "message": "Password must be at least 12 characters." }`

OpenAPI/`AdminAccountPasswordResetRequest` 등 **「12자 이상 · 3종 조합」** 과 `AdminAccountCreateRequest` **「이메일과 달라야 함」** 이 FE 정책과 충돌.

#### 목표 규칙 (Platform 기준)

| 항목 | 내용 |
|------|------|
| 안내 카피 | **영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.** |
| 최소 길이 | **8자** |
| 조합 | 영문 1+ · 숫자 1+ · 특수문자(`[^A-Za-z0-9]`) 1+ |
| Platform 검증 | `/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/` |

#### 서버 수정 요청

1. `createAdmin` / `rawPassword` 검증 → **8자 + 영문·숫자·특수문자**
2. signup / 비밀번호 변경 / 관리자 초기화 등 **동일 규칙 통일**
3. **email = 임시 비밀번호 허용** — 「email과 달라야 함」 제거 또는 사전등록 예외
4. 에러 메시지: `영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.`
5. OpenAPI 주석 갱신

### A.5 FE 현황

| 구분 | 상태 |
|------|------|
| CMS UI·`createUser` (email = temp password) | ✅ |
| 관리자 `createAdmin.rawPassword` | ✅ 전송 — **12자 정책 실패** |
| 개인·강사 pre-register `rawPassword` | ❌ 스키마 부재 |

---

## B. 학교(기관) — 등록 · 목록 · 상세

| Method | Path | 스키마 |
|--------|------|--------|
| `POST` | `/api/admin/users/pre-register/school` | `AdminPreRegisterSchoolRequest` |
| `GET` | `/api/admin/users` (`role=SCHOOL` 등) | 목록 row |
| `GET` | `/api/admin/users/{memberId}/school` | `SchoolMemberDetailResponse` |

**관련 FE:** `user-list-page.tsx` · `map-pre-register-request.ts` · `map-member-list-item.ts` · `map-member-detail-to-user.ts` · `institution-section.tsx`

### B.1 요약

1. 폼에 없는 `email`을 FE가 `school-{ts}@institution.jakorea.local`로 **임의 생성** → **optional·미전송** 계약 필요
2. **목록** `address` / `addressDetail` **전부 null** → 목록에도 내려줄 것 (상세에는 있음)
3. 목록·상세 「기관 소재지」= `address` + (있을 때만) `addressDetail`

### B.2 등록 — 더미 email

**현상:** 이메일 입력란 없음. `AdminPreRegisterSchoolRequest.email` required → FE 임시 email 전송.

**요청 (BE):**

- 학교 pre-register **`email` optional** (또는 기관 전용 계약에서 제외)
- 클라이언트 미입력 필드(`gender`, `birthDate`, 가짜 email 등) **서버가 채우지 않음** (uuid/memberId/createdAt 등 식별·감사 필드만 예외)
- **임시 비밀번호 대상 아님** (§A)

**FE:** optional 반영 후 email 미전송. required 제약으로 막히면 BE optional 선행.

### B.3 목록 — `address` / `addressDetail`

**현상:** 상세에는 주소 있음 · 목록은 null → 「기관 소재지」 `-`.

**요청:** 목록 row에 `address`, `addressDetail` 포함. 위치는 `schoolInfo.*` 또는 루트 — OpenAPI에 명시.

**FE:** `address` + (`addressDetail` 있을 때만 join). 동의어 필드 매핑.

### B.4 상세 — 기관 소재지

```text
기관 소재지 = address + (addressDetail이 null/빈 문자열이 아닐 때만 " " + addressDetail)
```

- 등록값 그대로 반환 (상세 OK면 목록만 §B.3)
- 기관 주소는 **마스킹·블러 미적용** (§1.2)

---

## C. 강사 — 신규 등록 payload ↔ 상세 조회

| Method | Path | 스키마 |
|--------|------|--------|
| `POST` | `/api/admin/users/pre-register/instructor` | `AdminPreRegisterInstructorRequest` |
| `GET` | `/api/admin/users/{memberId}/instructor` | `InstructorMemberDetailResponse` |
| `POST` | `/api/admin/users/{memberId}/instructor/privacy/unmask` | unmask |

**관련 FE:** `instructor-register-modal.tsx` · `user-list-page.tsx` · `map-pre-register-request.ts` · `map-instructor-register-extras.ts` · `map-member-detail-to-user.ts` · `user-to-applicant-instructor-row.ts`

### C.1 요약

강사 등록 폼 필드 대비 OpenAPI/상세에 **대응 필드 없음** 또는 **등록→상세 깨짐** 항목 존재.

- **API에 있는 필드** → FE 매핑 완료 (§C.2)
- **없는 필드** → 서버 추가 요청 (§C.3) · 상세 수정은 UI만(저장 API 없음)

| 등록·수정 폼 | 현재 API | 서버 요청 |
|--------------|----------|-----------|
| 구조화 학력 rows | `educationLevel` 요약만 | `educations[]` |
| 경력 `careerLevel` + `careers[]` | `careerText`만 | `careerLevel` + `careers[]` |
| JA Korea 활동 | 없음 | `jaKoreaActivities[]` |
| 수상·수료 | 없음 | `awards[]` |
| 자유작성 2~4 | `selfIntroduction` = 1번만 | `freeWrite2`~`4` 또는 `essays[]` |

### C.2 FE에서 이미 연결한 항목

| 폼 UI | 등록 | 상세 | 비고 |
|-------|------|------|------|
| 성명·성별·연락처·이메일 | `name`, `gender`, `phone`, `email` | `member.*` | |
| 생년월일 | `birthDate` | `member.birthDate` | **상세 null 버그 → §C.3.1** |
| 회원 유형 | `instructorType` | `primaryActivityType` | |
| 자택 주소 | `homeAddress`, `homeAddressDetail` | `homeAddress`만 | **§C.3.1.1** |
| 경력·소개 | `careerText`, `oneLineIntro`, `selfIntroduction` | 동명 | 마스킹·unmask → §C.3.1 |
| 계좌·사업소득 | `bankName`, `account*`, `bankAccounts`, `businessIncome` | 루트/배열 | |
| 자격증 | `certifications[]` | `certifications[]` | 빈 배열 관측 → §C.3.1 |
| 학력 요약 | `educationLevel` | `educationLevel` | 구조화 rows는 §C.3 |

### C.3 서버 필드·저장·상세 반환 추가 요청

#### C.3.1 등록은 받지만 상세에서 깨지는 항목 (P0)

| 필드 | 등록 | 상세 문제 |
|------|------|-----------|
| `birthDate` | 전송 | `member.birthDate` = `null` |
| `homeAddress` | 도로명 전체 | 마스킹 GET **시만** 반환 사례 → §C.3.1.1 |
| `homeAddressDetail` | 요청 있음 | **`InstructorDetailResponse`에 필드 없음** |
| `certifications[]` | 전송 | **빈 배열** 관측 |
| 소개·경력 | 원문 | `"마스킹"` 문자열 (unmask 필요) |

##### C.3.1.1 자택 주소 마스킹 · 상세 미노출

CMS 강사 상세 **자택 주소지**는 상세보기 전에도 **시·군·구까지** 표시 필요.

| 구분 | 기대 | 관측(문제) |
|------|------|------------|
| 마스킹 GET | **시군구** — 예: `서울특별시 관악구` | **시만** — 예: `서울특별시` |
| `homeAddressDetail` | 필드 분리 | 스키마 **없음** |
| unmask | 도로명 전체 + detail | 잘림·필드 누락 |

**요청 (BE):**

1. 마스킹 GET `homeAddress` 최소 **`{시/도} {시/군/구}`** (목표는 §1.2 **동까지**)
2. `homeAddress` · `homeAddressDetail` DB 분리 저장 · unmask 시 원문
3. `InstructorDetailResponse`에 **`homeAddressDetail`** 추가
4. 역할별 마스킹 단위 OpenAPI 명시 (§1.2 표 준수)

#### C.3.2 등록 폼 있으나 스키마 없어 FE 드롭 (P1)

| 폼 | FE | 서버 요청 |
|----|-----|-----------|
| 소속 / 학교교사 재직 | affiliation 문자열만 | `affiliation` / `affiliatedSchoolName` + `employmentStatus` |
| 구조화 학력 rows | `educationLevel` 요약만 | `educations[]` |
| 경력 rows | 미전송 | `careerLevel` + `careers[]` |
| JA 활동 | 미전송 | `jaKoreaActivities[]` |
| 수상 | 미전송 | `awards[]` |
| 자유작성 2~4 | 1번만 | `freeWrite2`~`4` 또는 `essays[]` |
| 동의서 작성형 5종 | UI만 | `termsType` 확장 |
| **초기 비밀번호** | 미전송 | **`rawPassword`** — **§A** |

#### C.3.3 상세·이력서·상세 수정에 필요 (P1)

등록 폼과 동일 UI의 `InstructorDetailEditForm` — **pre-register·상세 GET·PATCH** 모두 필드 필요.

| UI | 현재 | 필요 API |
|----|------|----------|
| 구조화 학력 | 요약 1행 / 수정 UI만 | `educations[]` |
| 경력 카드 | `careerDetails: []` | `careerLevel` + `careers[]` |
| JA·수상·자유작성 2~4 | 빈 값 / UI만 | 각 배열·필드 |
| 소속·재직 | loose `affiliation` | 구조화 필드 |

### C.4 관측 예시 (2026-07-28)

**등록 (발췌):**

```json
{
  "email": "ememail@em.com",
  "name": "김성명",
  "birthDate": "1997-07-21",
  "homeAddress": "서울특별시 관악구 조원로16길 7 (신림동, …)",
  "homeAddressDetail": "신림동상세주소…",
  "careerText": "16",
  "certifications": [ … ]
}
```

**상세 (발췌) — 문제:**

```json
{
  "member": { "birthDate": null },
  "instructorProfile": {
    "homeAddress": "서울특별시",
    "careerText": "마스킹",
    "oneLineIntro": "마스킹"
  },
  "certifications": []
}
```

---

## D. 통합 수락 기준

### D.0 P0 — 배경 (§1)

1. §1.1 역할별 등록·상세 path · OpenAPI 반영
2. §1.2 마스킹 표 · unmask · 기관 vs 자택 필드 분리

### D.1 P0 — 공통 (§A)

1. 개인·강사 pre-register `rawPassword` 수용·저장 → email/rawPassword 로그인 가능
2. OpenAPI `AdminPreRegisterIndividualRequest` / `AdminPreRegisterInstructorRequest` 문서화
3. `createAdmin` + Platform **8자** 규칙 · email=임시비밀번호 허용

### D.2 P0 — 학교 (§B)

1. 가짜 `*@institution.jakorea.local` 없이 등록 성공 (`email` optional)
2. 등록 `address` / `addressDetail`이 **목록**에 non-null
3. 목록·상세 「기관 소재지」 표시 규칙 일치

### D.3 P0 — 강사 (§C)

1. `birthDate` 상세 round-trip
2. 마스킹 GET 자택 **시군구** · `homeAddressDetail` 스키마 · unmask 원문
3. `certifications[]` round-trip
4. §A `rawPassword`

### D.4 P1 — 강사 폼 커버리지 (§C.3.2~3)

소속·구조화 학력·경력·JA·수상·자유작성 2~4 · 동의서 작성형

### D.5 P2 — 강사 마스킹 (§C)

`"마스킹"` vs unmask · 상세보기 후 소개·경력·계좌 원문

---

## E. 백엔드 회신 부탁

### 배경 (§1)

1. §1.1 path 확정·deprecated 단일 pre-register 처리
2. §1.2 마스킹/unmask OpenAPI 반영 ETA

### 공통 (§A)

1. `rawPassword` 필드명·required 확정 · 개인·강사 ETA
2. 최초 로그인 비밀번호 변경 강제 여부
3. §A.4 Platform 8자 통일 ETA · email=임시비번 허용
4. `password-reset` 동일 규칙 적용 여부
5. OpenAPI 배포 일정

### 학교 (§B)

1. `email` optional ETA
2. 목록 row 주소 필드 위치 (`schoolInfo.*` vs 루트)
3. 목록 null — 미구현 vs 버그

### 강사 (§C)

1. §C.3.1 (`birthDate`, certifications) ETA
2. §C.3.1.1 자택 **시군구** · `homeAddressDetail` · unmask ETA
3. §C.3.2 등록 1차 범위 (소속만 / 이력서 전체)
4. 동의서 `termsType` enum 확정

회신 주시면 CMS 등록 매핑·상세 표시를 이어서 맞추겠습니다.

**Last updated:** 2026-07-28 (단독 전달 — path·마스킹 §1 인라인)
