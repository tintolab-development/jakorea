# Cursor prompt — Gemini 찾아가는 연수 상세 · 카테고리별 API·필드 불일치 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 문서로 화면을 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 대상 화면 | CMS → 프로그램 관리 → Gemini 프로그램 → **찾아가는 연수** (`/programs/gemini/visiting-training`) |
| 탭 | `?tab=recruitment` (모집 공고) · `?tab=approved` (승인 연수) |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 계약은 바꾸지 마라 |
| 작성일 | 2026-10-01 |
| 기준 | **코드·OpenAPI 스키마 대조** (라이브 HTTP 스모크는 §검증 방법) |
| 상태 | **Cat5 상세 통합 SSOT.** 승인 상세 갭이 P0. 모집은 잔여 계약 모호점만 |
| 선행 문서 | [gemini-approved-training-detail-backend-prompt-2026-09-30.md](./gemini-approved-training-detail-backend-prompt-2026-09-30.md) — 본 문서가 상세 카테고리 통합본 |
| FE handoff (완료 후) | `JABACK/docs/frontend/gemini-visiting-training-detail-category-frontend-handoff-2026-10-01.md` |
| 시드 | [be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md](./be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md) GVT-R / GVT-A / GVT-T |

프론트 레포를 이 작업으로 고치지 마라. **백엔드만** 고친다.

---

## 한줄

모집 공고 상세(정보·기관 신청·담당자)는 remote GET/PATCH·기관 승인 API가 이미 붙어 있다.  
승인 연수 상세는 **목록 행 캐시로 껍데기만** 채우고, OpenAPI에 있는 `GET …/approved/{id}` 를 FE가 쓰지 않으며 스키마도 화면 PII·누적 건수를 못 채운다.  
강사 신청 목록은 **모집 programId 스코프 path만** 있고 승인 연수 id 스코프가 없으며 UI는 빈 배열이다.  
승인 담당자 LNB는 `approvedTrainingId`를 `programId`처럼 넘긴다 — 상세 응답에 **모집 `programId`** 가 항상 있어야 한다.

---

## 카테고리별 전환 현황 (2026-10-01)

| 탭 · LNB | Method / Path | FE 연동 | 전환 |
|---|---|---|---|
| 모집 · 정보 | `GET/PATCH /api/admin/gemini/trainings/recruitments/{programId}` | Query + PATCH edit | **연동됨** (잔여 보정 §모집) |
| 모집 · 기관 신청 | `GET …/recruitments/{programId}/organization-applications` · approve/reject/resend | Query + mutation | **연동됨** |
| 모집 · 담당자 | `GET /api/admin/programs/{programId}/managers` | `ProgramManagersTab(programId=recruitmentId)` | **연동됨** |
| 승인 · 정보 | OpenAPI: `GET …/approved/{approvedTrainingId}` | **미호출.** 목록 캐시 → `mapGeminiApprovedTrainingRowToDetail` | **부분 / P0** |
| 승인 · 강사 신청 | OpenAPI: `GET …/recruitments/{programId}/instructor-applications` 만 | `useState([])` + TODO | **미연동 / P1** |
| 승인 · 담당자 | 기존 managers API | `programId={approvedTrainingId}` **오전달** | **오매핑 / P0** |

FE 게이트: `geminiVisitingTraining` · mock 폴백 없음 (`shouldUseGeminiVisitingTrainingRemoteApi`).

---

## 1. 모집 공고 상세 — 잔여 불일치만

스키마: `GeminiRecruitmentDetailResponse`  
매퍼: `mapGeminiRecruitmentDetailToDetail` (`features/program/gemini/api/visiting-training/adapters.ts`)  
UI: `ui/detail/recruitment-info-tab.tsx`

왕복이 이미 맞는 필드(참고만 — BE 재작업 금지): `nameKo`↔공고명, `application*`/`trainingRequest*` 기간 분리, `targetLevels`/`recruitmentTargetDetail`, `minimumParticipantCount`, `contact*`, `otherMatters` null=해당없음, `thumbnailFileName`, `description`/`summary`, `recruitmentGuide`, `applicationMethod`, `learningSupportContent`, `additionalContentHtml`, `attachmentFileNames`, audit.

### 불일치 · 계약 모호점

| 화면/FE | FE 필드 | API/스키마 | 원인 | 요구 |
|---|---|---|---|---|
| 교육 형태 | `educationForm` (`online`\|`offline`만) | `educationForm`: `online`\|`offline`\|`hybrid`\|null | FE `mapEducationForm`: `hybrid`·기타 → **`offline`으로 강제** | **P2** GET이 `hybrid`면 UI와 어긋남. Gemini 모집은 `online`\|`offline`만 쓰거나, `hybrid`를 화면 옵션에 넣을지 BE·FE 계약 확정 |
| (UI 노출 약함) | `educationStructure` | GET 상세에 **필드 없음**. create/PATCH top-level 필수 | FE GET 매핑 시 항상 `SCHEDULE` 하드코딩 | **P2** GET에도 `educationStructure`를 내려 create/PATCH와 왕복. 없으면 FE가 SCHEDULE로 덮어 PATCH 시 왜곡 가능 |
| 프로그램 소개 | `programDescription` | `description` **또는** `summary` (둘 다 있으면 FE는 description 우선 후 summary) | 이중 키 | **P2** 상세 GET SSOT를 `description` 하나로 확정. `summary`는 목록 전용이면 문서화 |
| `serviceDetailJson` | — | create/PATCH에 `geminiRecruitment` sidecar 병행 | FE는 GET에서 **sidecar 미파싱** (top-level만) | **유지** — top-level 왕복이 SSOT. sidecar만 채우고 top-level 비우지 마라 |

### 모집 · 기관 신청

스키마: `GeminiOrganizationApplicationItem`  
매퍼: `mapGeminiOrganizationApplicationToRow`

| 화면 라벨 | FE | API | 비고 |
|---|---|---|---|
| 신청 기관명 | `institutionName` | `organizationName` | OK |
| 기관 소재지 | `institutionSido`+`Sigungu` | `regionSido`/`regionSigungu` | OK |
| 프로그램 승인 현황 | `APPROVED`/`REJECTED`/`PENDING` | `applicationStatus` | FE: `APPROVED`\|`ASSIGNED`→승인, `REJECTED`\|`AUTO_REJECTED`\|`CANCELLED`→반려, 그외 PENDING. **새 enum 추가 시 FE 매핑 공지** |
| 강의 진행 희망 교육 날짜 및 시간 | `preferredLectureSchedule` | `preferredLectureScheduleText` 우선, 없으면 blocks 포맷 | OK (09-30 희망일정 프롬프트 반영분) |
| 수강 인원 | `studentCount` | `requestedStudentCount` | OK |
| 담당 교사명 | `teacherName` | `teacherName` | null → FE `'-'` |

추가 BE 작업 없음. enum 변경만 공지.

### 모집 · 담당자

`ProgramManagersTab`에 **모집 `programId`** 전달 — 정상. 승인 상세와 혼동하지 마라.

---

## 2. 승인 연수 상세 — 핵심 갭 (P0)

### 2.1 지금 FE가 하는 일

| 단계 | 코드 |
|---|---|
| 상세 훅 | `use-gemini-approved-training-detail.ts` — `approved` infinite list 캐시에서 `id` 행만 찾음 |
| 매퍼 | `mapGeminiApprovedTrainingRowToDetail` (`model/approved/approved-detail-resolver.ts`) |
| UI | `ui/approved/detail-program-info-tab.tsx` · `build-manager-profile-fields.tsx` |

`GET /api/admin/gemini/trainings/approved/{approvedTrainingId}` 는 **full** `backend.openapi.json`에 path가 있다.  
dashboard Orval 스키마 `GeminiApprovedTrainingDetailResponse` 는 있으나 **FE Query 미연결**.  
목록만 두껍게 만들어 상세를 대체하지 마라.

### 2.2 3자 대조 — 연수·기관

| 화면 라벨 | FE 상세 필드 | 목록 `GeminiApprovedTrainingItem` | OpenAPI DetailResponse | FE 기본값/동작 | 요구 |
|---|---|---|---|---|---|
| 공고명 | `recruitmentTitle` | `recruitmentTitle` | `recruitmentTitle` | 목록 | P0 상세에도 동일 |
| 연수일시 | `trainingDate`+`trainingTimeText` | 있음. **미매칭 시 목록 `trainingDate`를 `lastPreferredDate`에 복사** | `trainingDate`·`trainingStart/EndTime`·`trainingTimeText` | 강사 미지정이면 화면 `-` | P0 **확정일**과 **3지망 마지막일(`lastPreferredDate`)** 분리. 스키마에 `lastPreferredDate` **추가** |
| 프로그램 진행 현황 | FE 날짜 파생 | `progressStatus` 있으나 목록 배지에 미사용 | `progressStatus` | 서버 enum과 FE 파생 병행 가능 | P0 enum 확정 + 원천 날짜 누락 금지 |
| 수강 인원 | `studentCount` | `studentCount` | `studentCount` | 목록 | P0 |
| 기관명 | `institutionName` | 있음 | 있음 | 목록 | P0 |
| 기관 소재지 | `institutionAddress` | sido+sigungu만 합침 | `institutionAddress`·`AddressDetail`·sido/sigungu | 도로명 없음 | P0 도로명·상세 주소 |
| 프로그램 신청 횟수 | `recruitmentCount` | **없음** | **없음** | 항상 `0` | P0 → `institutionApplicationCount` |
| 프로그램 수강 횟수 | `completedRecruitmentCount` | **없음** | **없음** | 항상 `0` | P0 → `institutionCompletedTrainingCount` |
| 등록일 | `joinedAt` | **없음** | **없음** (`submittedAt`≠등록일) | `''` | P0 → `institutionJoinedAt` |
| (담당자 LNB용) | — | `programId` (목록에 있을 수 있음) | `programId` | 상세 훅이 목록만 써서 **상세 전용으로 안 씀** | P0 상세 **항상** `programId`·`organizationApplicationId`·`recruitmentId` |

`progressStatus` enum (FE `GeminiApprovedTrainingStatus`와 동일하게):

| 값 | 화면 |
|---|---|
| `SCHEDULED` | 프로그램 진행 예정 |
| `IN_PROGRESS` | 프로그램 진행 중 |
| `COMPLETED` | 프로그램 진행 완료 |
| `NOT_CONDUCTED` | 프로그램 미진행 |

### 2.3 3자 대조 — 담당 교사 (목록에 넣지 마라)

| 화면 라벨 | FE 필드 | 목록 | DetailResponse 현재 | FE 기본값 | 요구 |
|---|---|---|---|---|---|
| 성명 | `managerNameKo` | `managerName` | `managerName` | 목록명 | P0 |
| (일정변경 배지) | `managerScheduleChangeCount` | 없음 | 없음 | `0` | P1 |
| 성별 및 생년월일 | `managerGender` · `managerBirthDate` | 없음 | 없음 | `''` | **P0** |
| 연락처 · 이메일 | `managerContact` · `managerEmail` | 없음 | 없음 | `''` → 화면 `-` | **P0** |
| 소속 | `managerSchool` + `managerEmploymentStatus` | 없음 | 없음 | 학교 `''`, 상태 **`ACTIVE`(재직중)** | **P0** 학교명·재직 enum. 없으면 null — `ACTIVE`로 꾸미지 마라 |
| 강사 경력 | `managerLectureExperience` | 없음 | 없음 | `''` → `-` | P0 |
| 자택 주소지 | `managerHomeAddress` | 없음 | 없음 | `''` | P0 |
| 정산 계좌 정보 | bank/number/holder | 없음 | 없음 | `''` | P0 |
| 직급 · 과목 | `managerPosition` · `managerSubject` | 없음 | 없음 | `''` | P0 |
| 강사비 등급 | `managerInstructorFeeGrade` | 없음 | 없음 | `''` → `-` | P0 |
| 사업소득자 | `managerBusinessIncomeLabel` | 없음 | 없음 | `''` | P0 |
| 한 줄 소개 | `managerOneLineIntro` | 없음 | 없음 | `''` | P0 |
| (회원 연결) | `managerMemberId` | 없음 | `managerAdminId`만 (이름 혼동) | `''` | P0 **교사 회원 id** (`managerMemberId`). admin id와 혼동 금지 |

### 2.4 3자 대조 — 연수 담당 강사 (강사 배정된 행만 섹션 표시)

| 화면 라벨 | FE `instructor.*` | 목록 | DetailResponse | FE 기본값 | 요구 |
|---|---|---|---|---|---|
| 신청 강사명 | `name` | `instructorName` | `instructorName` | 미지정/`미지정` | P0 |
| 자택 주소지 | `region` | 없음 | 없음 | `-` | P0 |
| JA 강의 경력 | `experienceYears` | 없음 | 없음 | `0` | P0 |
| JA 평가 등급 | `grade` | 없음 | 없음 | `-` | P0 |
| 연락처 · 이메일 | `contact` · `email` | 없음 | 없음 | `-` | P0 |
| (회원) | — | 없음 | `instructorMemberId` | — | P0 유지·채움 |

### 2.5 공문

| 화면 라벨 | FE | API | 비고 |
|---|---|---|---|
| 공문 필요 여부 | `officialDocumentType` | `officialDocumentRequired` boolean | FE: true→`필요`, false→`필요 없음` |
| 공문 필요 정보 | 고정 문구 | 없음 | true일 때 FE 고정: `이름, 소속(학교), 연수예정일시, 연수인원` — BE 필드 불필요 |

---

## 3. 승인 · 강사 신청 목록 (P1)

| 항목 | 현재 |
|---|---|
| UI | `detail-instructor-application-tab.tsx` — 행 `[]`, 승인/변경 TODO |
| OpenAPI list | `GET /api/admin/gemini/trainings/recruitments/{programId}/instructor-applications` (**모집 id**) |
| OpenAPI mutation | `POST …/instructor-applications/{applicationId}/approve\|reject` (client만) |
| 스키마 | `GeminiInstructorApplicationItem` — 화면 컬럼 대비 필드 부족 |

### 화면 컬럼 vs 스키마

| 화면 컬럼 | FE row 필드 | `GeminiInstructorApplicationItem` | 요구 |
|---|---|---|---|
| 신청 강사명 | `instructorName` | `instructorName` | OK |
| 자택 주소지 | `homeSido`+`homeSigungu` | **없음** | P1 추가 |
| JA 강의 경력 | `experienceYears` | **없음** | P1 |
| JA 평가 등급 | `grade` | `instructorFeeGradeSnapshot`? (의미 불명) | P1 **평가 등급** 명시 필드 |
| 연락처 · 이메일 | `contact` · `email` | **없음** | P1 |
| 배정횟수(월별) | `monthlyAssignmentCount` | **없음** | P1 |
| 프로그램 승인 현황 | `approvalStatus` | `applicationStatus` | P1 enum 매핑 문서화 |
| — | — | `distanceKm` · `longDistance` · `availableScheduleMemo` | 화면 미사용 — 유지 OK |

### Path 요구 (P1)

```http
GET /api/admin/gemini/trainings/approved/{approvedTrainingId}/instructor-applications
```

- 이 승인 연수(기관 신청)에 달린 강사 신청만 반환
- 기존 `…/recruitments/{programId}/instructor-applications` 는 모집 단위 전체용으로 둘 수 있으나, **승인 상세 LNB는 승인 id 스코프**가 필요
- approve/reject는 기존 applicationId mutation 재사용 가능

---

## 4. 승인 · 담당자 정보 (P0)

| 항목 | 현재 |
|---|---|
| UI | `ProgramManagersTab programId={approvedTrainingId}` (`detail-fullpage-modal.tsx`) |
| 결과 | managers API에 **승인 연수/기관신청 id**가 넘어가 **0건** |
| 해결 | 상세 GET에 **모집 공고 `programId`** 를 항상 포함 → FE 후속에서 그 값으로 managers 조회 |

담당자 CRUD API를 새로 만들지 마라.  
목록 item에 `programId`가 있어도 상세 GET이 SSOT다.

---

## 요구사항 요약

### P0

1. `GET /api/admin/gemini/trainings/approved/{approvedTrainingId}` 를 **dashboard OpenAPI에도** 노출하고 응답을 채운다.
2. `GeminiApprovedTrainingDetailResponse`에 §2 표의 누락 필드 추가 (`lastPreferredDate`, `institutionApplicationCount`, `institutionCompletedTrainingCount`, `institutionJoinedAt`, 교사 PII·재직, 강사 프로필 등).
3. `programId` · `organizationApplicationId` · `recruitmentId` 항상 포함.
4. 없는 값은 `null`. 화면용으로 `0`/`ACTIVE`/`''` 로 꾸미지 마라.
5. 전화·이메일·계좌·상세 주소·생년월일은 **목록 응답에 넣지 마라.**

### P1

1. `GET …/approved/{approvedTrainingId}/instructor-applications` + 화면 컬럼 필드.
2. (선택) `managerScheduleChangeCount`.

### P2 (모집 잔여)

1. `educationForm` hybrid 정책 확정.
2. GET 상세에 `educationStructure`.
3. `description` vs `summary` SSOT.

---

## 비범위

- 실적 관리 (Cat6 / training-reports)
- Platform 포털
- 모집 create/PATCH top-level 재설계 (이미 왕복 중)
- 목록 서버 필터 확장
- FE 매퍼·훅 수정 (BE 완료 후 별도 FE handoff)

---

## DoD

- [ ] 승인 상세 GET이 목록 `id`로 200, 없는 id 404
- [ ] 응답에 `programId` 포함 → managers가 모집 담당자를 조회 가능 (FE 후속)
- [ ] §2.2~2.4 P0 필드가 스키마·실응답에 존재 (null 허용)
- [ ] `lastPreferredDate` ≠ 미매칭 시 확정 `trainingDate` 위장
- [ ] dashboard OpenAPI + Orval 스키마 갱신 가능
- [ ] P1 path·스키마 (강사 목록) 문서화 또는 구현
- [ ] GENERAL 등 타 유형 회귀 없음

---

## FE 후속 (BE 완료 후 · 이 문서로 하지 마라)

1. `useQuery`로 승인 상세 GET 연결, 목록 캐시 폴백 제거.
2. `mapGeminiApprovedTrainingDetailResponseToDetail` 신설 — FE 기본값 제거.
3. `ProgramManagersTab programId={detail.programId}`.
4. 강사 신청 탭 remote Query + approve/reject.
5. Orval 재생성.

---

## 검증 방법 (BE)

```http
GET /api/admin/gemini/trainings/approved?page=0&size=20
GET /api/admin/gemini/trainings/approved/{idFromList}
GET /api/admin/programs/{programIdFromDetail}/managers
GET /api/admin/gemini/trainings/approved/{id}/instructor-applications
```

시드: GVT-A-01~04 (승인) · GVT-T-01~03 (강사 신청).  
CMS 확인 경로: `/programs/gemini/visiting-training?tab=approved&approvedTrainingId=…` — **FE 연동 전에는 Network만으로 응답 필드를 검증**한다.

---

## 관련 문서

| 문서 | 역할 |
|---|---|
| [gemini-approved-training-detail-backend-prompt-2026-09-30.md](./gemini-approved-training-detail-backend-prompt-2026-09-30.md) | 승인 상세 초기 프롬프트 (본 문서에 통합) |
| [gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md](./gemini-recruitment-detail-field-roundtrip-backend-prompt-2026-09-30.md) | 모집 상세 왕복 (반영 완료) |
| [gemini-organization-application-list-fields-backend-prompt-2026-09-30.md](./gemini-organization-application-list-fields-backend-prompt-2026-09-30.md) | 기관 신청 목록 |
| [programs-gemini-visiting-training-api-conversion-status.md](./programs-gemini-visiting-training-api-conversion-status.md) | 구 Phase 스냅샷 (2026-07 — mutation 서술 낡음) |
