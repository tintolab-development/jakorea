# 강사 신규 등록 UI ↔ OpenAPI 불일치 정리

**Date:** 2026-08-06  
**Endpoint:** `POST /api/admin/users/pre-register/instructor`  
**OpenAPI DTO:** `AdminPreRegisterInstructorRequest` (`apps/cms/openapi/members.openapi.json`)  
**CMS UI:** `instructor-profile-form` / `InstructorRegisterModalFormValues`  
**FE mapper:** `mapCreateUserRequestToPreRegisterInstructor` · `handleInstructorRegisterSubmit`

---

## 1. 요약

| 구분 | 건수(대략) | 의미 |
|------|------------|------|
| ✅ UI ↔ API 연동됨 (legacy flat) | 다수 | `name`·`careerText`·`termsAgreements` 등 flat 필드 round-trip |
| ⚠️ FE 전송 · BE 미반영 | 학력·경력·소속·자유작성 2~4 등 | **`profile`/`settlement` extended body** — OpenAPI·저장 없음 |
| 🔶 API만 존재 (UI 미수집) | `feeGrade`, `jaGrade` | OpenAPI에 있으나 등록 폼에 없음 |

---

## 2. 연동됨 (UI → OpenAPI)

| CMS UI (라벨 · form) | OpenAPI / payload | 비고 |
|---------------------|-------------------|------|
| 성명 · `name` | `name` | 필수 |
| 이메일 · `email` | `email` | 필수 · 임시비번=이메일 |
| 연락처 · `contact` | `phone` | |
| 성별 · `gender` | `gender` (`M`/`F`) | FE `남성`/`여성` → API 성별 코드 |
| 생년월일 · `birthDate` | `birthDate` | `YYYY-MM-DD` |
| 회원 유형 · `memberType` | `instructorType` | `general`→`GENERAL`, `school_teacher`→`SCHOOL_TEACHER` |
| 자택 주소 · `homeAddress` | `homeAddress` | |
| 상세주소 · `homeAddressDetail` | `homeAddressDetail` | |
| 한 줄 소개 · `oneLineIntro` | `oneLineIntro` | |
| 강사 경력(연차) · `instructorCareer` | `careerText` | **숫자/요약 문자열** — 구조화 경력과 별개 |
| 자유작성 1 · `freeWrite1` | `selfIntroduction` | |
| 최종 학력 구분·상태 · `eduSchoolType` / `eduStatus` | `educationLevel` | `"high / graduated"` 요약만 |
| 은행 · 계좌 · 예금주 | `bankName` · `accountNumber` · `accountHolder` + `bankAccounts[]` | 루트·배열 동시 전송 |
| 사업소득 · `isBusinessIncome` | `businessIncome` | |
| 자격증 · `licenseRows` | `certifications[]` | 제목 있는 행만 · `acquiredYear`→`issuedDate`(YYYY-01-01) |
| 약관·동의 8건 | `termsAgreements[]` | 아래 §4 |

임시 비밀번호: FE `rawPassword` = 이메일. OpenAPI는 `rawPassword` **optional**, “입력 시 이메일과 동일 · 실제 초기비번은 정규화 이메일” — **현재 FE 송신과 정합**.

---

## 3. UI만 있고 OpenAPI에 없거나 BE round-trip 없음 (2026-08-06)

> FE는 §3.8 `profile`/`settlement`로 **전송 중** — OpenAPI·BE 저장·GET 반환은 **미구현**.

| CMS UI 섹션 | form 필드 | FE pre-register | OpenAPI | BE GET |
|-------------|-----------|-----------------|---------|--------|
| **학력 상세** | `educationDetailKeys`, `highSchool`, `college*`, `graduate[]` | `profile.education.*` | flat `educationLevel`만 | flat만 |
| **경력 구분·경력 사항** | `careerLevel`, `careers[]` | `profile.career.*` | **없음** | **없음** |
| **JA Korea 활동** | `jaKoreaRows[]` | `profile.jaKoreaActivities[]` | **없음** | **없음** |
| **수상 이력** | `awardRows[]` | `profile.awards[]` | **없음** | **없음** |
| **자유작성 2~4** | `freeWrite2`~`4` | `profile.essays.*` | **없음** | **없음** |
| **교사 회원 소속** | `schoolName`, `employmentStatus` | `profile.affiliation.*` | **없음** | **없음** |
| **일반 강사 소속** | `affiliationName`, `affiliationNone` | `profile.affiliation.organizationNames[]` | **없음** | **없음** |

---

## 4. 약관 `termsAgreements` — UI ↔ canonical `termsType`

| CMS UI | form | `termsType` (송신) | required(등록 정책) |
|--------|------|-------------------|---------------------|
| 서비스 이용약관 | `consentTermsOfService` | `SERVICE_TERMS` | 필수 |
| 개인정보 수집·이용 | `consentPersonal` | `PRIVACY_COLLECTION` | 필수 |
| 마케팅 제공 동의 | `consentMarketing` | `MARKETING` | 선택 |
| 초상권 | `consentPortrait` | `PORTRAIT_RIGHTS` | 선택(동의서) |
| 지급조서 사전 동의 | `consentPaymentStatement` | `PAYMENT_STATEMENT_PRE_CONSENT` | 선택(동의서) ※원장 정규화 시 `PAYMENT_STATEMENT_CONSENT` 가능 |
| 교육진행자 서약 | `consentEducatorPledge` | `FACILITATOR_PLEDGE` | 선택(동의서) |
| 행정정보 공동이용 | `consentAdministrativeJoint` | `ADMINISTRATIVE_INFO_CONSENT` | 선택(동의서) |
| 성범죄 경력조회 | `consentSexOffenseCheck` | `CRIMINAL_HISTORY_CHECK_CONSENT` | 선택(동의서) |

**상세 조회 갭:** `InstructorMemberDetailResponse` OpenAPI에 **`termsAgreements` 없음** (개인 상세에는 있음).  
등록 시 보낸 동의는 상세 DTO만으로는 round-trip 보장 안 됨 → `consent-records` 또는 상세에 `termsAgreements` 추가 필요.

---

## 5. OpenAPI만 있고 등록 UI 미수집

| OpenAPI | CMS 등록 UI | 비고 |
|---------|-------------|------|
| `feeGrade` | 없음 | 상세/목록에서 등급 표시·수정은 별도 |
| `jaGrade` | 없음 | 동일 |
| `external1365Id` | 등록 폼 없음 | 개인 등록·상세 쪽 연동과 분리 |

---

## 6. 의미·이름 불일치 (연동은 되나 혼동)

| OpenAPI | CMS 등록 라벨 | 주의 |
|---------|---------------|------|
| `careerText` | **강사 경력** (연차) | 「경력사항」테이블과 **다름** |
| `selfIntroduction` | **자유작성 1** | 「한 줄 소개」(`oneLineIntro`)와 **별개** |
| `educationLevel` | 최종 학력 2필드 요약 | 학력 상세 rows ≠ `educationLevel` |
| `certifications` | **자격증** (`licenseRows`) | **수상**(`awardRows`)은 미포함 |

---

## 7. BE / FE 요청 (우선순위 · 2026-08-06)

> **상세 BE 수정 요청 SSOT:** [instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md §3](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#3-be-수정-필요-내역-회원관리--강사-등록상세)

### P0 — §3.8 `profile` / `settlement` OpenAPI + round-trip

- FE **이미 전송** (`map-pre-register-request.ts` · `map-patch-user-basic-info.ts`)
- BE: `AdminPreRegisterInstructorRequest` · `InstructorMemberDetailResponse`에 스키마 추가 · 저장·GET·PATCH
- codegen 후 FE extended type 제거

### P0 — 상세 약관 round-trip

- `GET` 강사 상세에 `termsAgreements[]` 추가 **또는** `consent-records`가 등록 8건 `termsType`/`consentType`과 1:1 일치
- OpenAPI `InstructorMemberDetailResponse`에 `termsAgreements?` 반영 후 codegen

### P1 — legacy flat + 마스킹 GET (handoff §3.1·§3.2)

- 공개 프로필 필드 마스킹 GET 원문 · 주소 truncation

### P2 — 문서

- Swagger `@Schema(description)`에 CMS 라벨·form name 병기
- 본 문서 = UI↔OpenAPI 필드 갭 SSOT · handoff §3 = BE 수정 요청 SSOT

---

## 8. 관련 코드

| 역할 | 경로 |
|------|------|
| 등록 폼 모델 | `apps/cms/src/features/user/shared/ui/instructor-profile-form/instructor-profile-form-model.ts` |
| 등록 제출 | `apps/cms/src/pages/users/user-list-page.tsx` → `handleInstructorRegisterSubmit` |
| API 매핑 | `apps/cms/src/features/user/api/map-pre-register-request.ts` |
| §3.8 profile mapper | `apps/cms/src/features/user/api/map-instructor-cms-profile.ts` |
| FE DTO (codegen 전) | `apps/cms/src/features/user/api/types/instructor-cms-profile-proposal.ts` |
| 학력/자격 빌더 | `apps/cms/src/features/user/api/map-instructor-register-extras.ts` |
| 약관 빌더 | `apps/cms/src/features/user/api/build-pre-register-terms-agreements.ts` |
| 상세 DTO | `InstructorMemberDetailResponse` (generated) |

**Last updated:** 2026-08-06 (§3.8 FE profile 전송 · handoff §3 교차 참조)
