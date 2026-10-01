# Cursor prompt — Gemini 승인 연수 상세 GET · 강사 신청 목록 (JABACK)

> **통합 SSOT (2026-10-01):** 모집·승인 상세 LNB 전체 카테고리 대조는  
> [gemini-visiting-training-detail-category-api-field-mismatch-backend-prompt-2026-10-01.md](./gemini-visiting-training-detail-category-api-field-mismatch-backend-prompt-2026-10-01.md) 를 우선한다.  
> 본 문서는 승인 상세·강사 목록 요구의 원본이다.

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** (프론트 `jakorea` 에서 이 문서로 화면을 고치지 마라) |
| 작업 위치 | 백엔드 프로젝트에서 이 프롬프트를 열어 구현·테스트·커밋한다 |
| 주 API | `GET /api/admin/gemini/trainings/approved/{approvedTrainingId}` |
| 후속 API | `GET /api/admin/gemini/trainings/approved/{approvedTrainingId}/instructor-applications` |
| 스키마 | `GeminiApprovedTrainingDetailResponse` 확장 · `GeminiInstructorApplicationItem` 확장 |
| 대상 화면 | CMS → 프로그램 관리 → Gemini 프로그램 → **찾아가는 연수** → 탭 **승인 연수** → 행 클릭 상세 |
| 프로그램 유형 | `GEMINI_TRAINING` 만. GENERAL / UJAT / 1사1교 / TRAINED_TEACHER 계약은 바꾸지 마라 |
| 우선순위 | **P0** 상세 GET · **P1** 강사 신청 목록 |
| 작성일 | 2026-09-30 |
| 상태 | **미착수.** 목록 GET은 동작. 상세 GET은 필터된 dashboard OpenAPI에 operation이 없고, FE는 목록 행으로 껍데기만 채운다 |
| FE handoff (완료 후) | `JABACK/docs/frontend/gemini-approved-training-detail-frontend-handoff-2026-09-30.md` |
| 시드 기준 | `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md` GVT-A-01~04 · GVT-T-01~03 |

프론트 레포를 이 작업으로 고치지 마라. **백엔드만** 고친다.

---

## 한줄

승인 연수 **목록**은 `GET /api/admin/gemini/trainings/approved` 로 나온다.  
**상세**는 같은 id로 조회하는 GET이 없어, CMS 「프로그램 정보」의 교사 연락처·등록일·신청/수강 횟수·확정 연수일시와 「강사 신청 목록」이 비어 있다.  
목록에 이미 있는 값을 상세에서 다시 주고, 목록에 없는 화면 필드를 **상세 응답에 추가**해라.

---

## 증상 (CMS · 2026-09-30 로컬 `http://localhost:8080`)

경로: `/programs/gemini/visiting-training?tab=approved`  
목록 `총 7건`. 행 클릭 시 쿼리 `approvedTrainingId` 가 목록 item `id` 다.

실측 행: `approvedTrainingId=185334` · 기관명 **부산다온초등학교** · 공고명 **제미나이 아카데미 찾아가는 연수 모집**.

### LNB 「프로그램 정보」

| 화면 라벨 | 실측 | 원인 |
|---|---|---|
| 공고명 | 제미나이 아카데미 찾아가는 연수 모집 | 목록 `recruitmentTitle` |
| 연수일시 | `-` | 강사명이 `미지정`이면 FE가 일시를 숨긴다. 목록은 확정일과 3지망 마지막일을 구분하지 않는다 |
| 프로그램 진행 현황 | 프로그램 진행 예정 | FE가 날짜로 파생. 상세 전용 상태 필드가 없다 |
| 수강 인원 | 15명 | 목록 `studentCount` |
| 기관명 | 부산다온초등학교 | 목록 `institutionName` |
| 기관 소재지 | 부산광역시 해운대구 | 목록 `institutionSido` + `institutionSigungu` 만. 도로명 주소 없음 |
| 프로그램 신청 횟수 | **0회** | 응답 필드 없음. FE 기본값 `0` |
| 프로그램 수강 횟수 | **0회** | 동일 |
| 등록일 | **빈칸** | 응답 필드 없음. FE `''` |
| 담당 교사 성명 | 테스트 마스터 관리자 | 목록 `managerName` 만 |
| 성별 및 생년월일 | **빈칸** | 없음 |
| 연락처 · 이메일 | **`-`** | 없음. 목록에 넣지 마라 |
| 소속 | 빈칸 + 배지 「재직중」 | 학교명 없음. 재직 상태는 FE 기본값 `ACTIVE` |
| 강사 경력 · 자택 주소 · 정산 계좌 · 직급 · 과목 · 강사비 등급 · 사업소득자 · 한 줄 소개 | **`-` 또는 빈칸** | 없음 |
| 연수 담당 강사 · 연수 공문 섹션 | **안 보임** | 강사 미지정으로 FE가 섹션을 숨긴다. 매칭된 행도 강사 프로필 필드가 없다 |

### LNB 「강사 신청 목록」

화면 셸(필터·테이블)은 열린다. **총 0건 · No data.**  
FE는 이 탭을 API에 연결하지 않았다. `GeminiInstructorApplicationItem` 스키마는 있으나, 승인 연수 id로 조회하는 operation이 필터된 dashboard OpenAPI에 없다.

### LNB 「담당자 정보」

기존 프로그램 담당자 목록 UI가 열린다. **0건.**  
FE가 `approvedTrainingId`(승인 연수/기관 신청 id)를 프로그램 id처럼 넘긴다. 상세 응답에 **모집 공고 `programId`** 가 있어야 기존 `GET /api/admin/programs/{programId}/managers` 로 조회할 수 있다. 담당자 CRUD API를 새로 만들지 마라.

---

## 지금 FE가 하는 일 (BE가 채울 빈칸의 정본)

상세 모달은 메모리 저장소가 아니라 **이미 받은 승인 연수 목록 캐시**에서 같은 `id` 행을 찾는다.

- 훅: `apps/cms/src/features/program/gemini/hooks/use-gemini-approved-training-detail.ts`
- 매퍼: `mapGeminiApprovedTrainingRowToDetail` (`…/model/approved/approved-detail-resolver.ts`)

목록 행에 없는 값은 전부 기본값이다.

| FE 상세 필드 | 목록에서 채움 | 그 외 기본값 |
|---|---|---|
| `recruitmentTitle` · `institutionName` · `studentCount` · `managerNameKo` | 예 | |
| `institutionAddress` | `institutionSido + institutionSigungu` | |
| `trainingDate` · `trainingTimeText` | 예. 강사 미지정이면 화면은 `-` | |
| `lastPreferredDate` | **목록 `trainingDate`를 그대로 복사** | 3지망 마지막일과 확정일이 섞인다 |
| `instructorAssigned` | `instructorName` 이 비거나 `미지정`이면 false | |
| `recruitmentCount` · `completedRecruitmentCount` | | `0` |
| `joinedAt` · 교사 연락처/이메일/학교/주소/계좌 등 | | `''` |
| `managerEmploymentStatus` | | `ACTIVE` (화면 배지 「재직중」) |
| `officialDocumentType` | `officialDocumentRequired` boolean | `필요` / `필요 없음` |
| `officialDocumentRequiredInfo` | | boolean이 true면 FE 고정 문구 `이름, 소속(학교), 연수예정일시, 연수인원` |

상세 GET이 생기면 FE는 이 기본값을 응답 값으로 바꾼다. **목록만 두껍게 만들어 상세를 대체하지 마라.** 전화·이메일·계좌·상세 주소는 목록 응답에 넣지 마라.

---

## 현재 계약

### 목록 (동작 중 · 유지)

`GET /api/admin/gemini/trainings/approved?keyword=&page=&size=`

`GeminiApprovedTrainingItem`:

| 필드 | 목록 컬럼 |
|---|---|
| `id` | 행 클릭 id. **상세 path id와 같아야 한다** |
| `programId` | 모집 공고 id. 담당자 LNB용. 목록에 이미 있으면 유지 |
| `organizationApplicationId` | 기관 신청 id |
| `recruitmentId` | 모집 id (programId와 같으면 둘 다 같은 값) |
| `recruitmentTitle` | (상세 공고명. 목록 컬럼은 아님) |
| `institutionName` · `institutionSido` · `institutionSigungu` | 기관명 · 소재지 |
| `progressStatus` | 목록은 이 값을 배지에 쓰지 않고 FE가 날짜로 다시 계산한다 |
| `trainingDate` · `trainingTimeText` | 연수일시 |
| `studentCount` | 수강 인원 |
| `instructorName` | 강사. 없으면 null (FE는 `미지정`) |
| `managerName` | 기관 담당자명 |
| `officialDocumentRequired` | 목록 필터용 |

목록 query는 지금 `keyword`(기관명)만 서버로 간다. 시/도·진행현황·공문·연수일 필터는 FE 로컬 필터다. 이번 범위 밖.

### 상세 스키마 (컴포넌트만 있고 operation 없음)

필터된 `apps/cms/openapi/dashboard.openapi.json` 에는 `GeminiApprovedTrainingDetailResponse` **스키마만** 있고  
`/api/admin/gemini/trainings/approved/{id}` **path는 없다.**

스키마에 이미 있는 필드: `id` · `programId` · `organizationApplicationId` · `recruitmentId` · `recruitmentTitle` · `recruitmentDescription` · `progressStatus` · `applicationStatus` · `institutionName` · `institutionSido` · `institutionSigungu` · `institutionAddress` · `institutionAddressDetail` · `scheduleId` · `scheduleName` · `trainingDate` · `trainingStartTime` · `trainingEndTime` · `trainingTimeText` · `studentCount` · `classCount` · `requestedScheduleMemo` · `instructorMemberId` · `instructorName` · `managerAdminId` · `managerName` · `officialDocumentRequired` · `submittedAt` · `approvedAt` · `updatedAt`.

로컬 목록 7건이 이 스키마로 상세 조회되지 않는다. path를 공개하고, 아래 P0 필드를 **추가**해라.

---

## 요구사항 P0 — 승인 연수 상세 GET

### 1. Operation

```http
GET /api/admin/gemini/trainings/approved/{approvedTrainingId}
```

- `{approvedTrainingId}` = 목록 item `id` (로컬 예: `185334`)
- 없으면 **404**. 다른 프로그램 유형 id로 조회해도 404
- 권한: 관리자 읽기 (기존 승인 연수 목록과 동일)
- 페이지네이션 없음. 단건 객체
- `programId` · `organizationApplicationId` · `recruitmentId` 를 **항상** 포함한다. 목록 `id`와 이 셋이 다를 수 있다. FE 담당자 탭은 `programId`만 쓴다

### 2. 연수·기관 (목록 값 + 상세 전용)

없는 값은 `null`. `0`으로 꾸미지 마라. FE가 `0회`와 빈칸을 구분해야 한다.

| 필드 | 타입 | CMS 라벨 | 정의 |
|---|---|---|---|
| `recruitmentTitle` | string | 공고명 | 연결된 모집 공고명 |
| `trainingDate` | date `YYYY-MM-DD` \| null | 연수일시 날짜 | **강사 매칭으로 확정된 날짜.** 미매칭이면 null |
| `trainingStartTime` | string `HH:mm` \| null | 연수일시 | 확정 시작 |
| `trainingEndTime` | string `HH:mm` \| null | 연수일시 | 확정 종료 |
| `trainingTimeText` | string \| null | 연수일시 오른쪽 | 표시 문자열. 예: `15:30~16:40(2차시)`. 미매칭이면 null |
| `lastPreferredDate` | date \| null | (상태 파생용, 화면 직접 라벨 없음) | 희망 일정 **3지망(마지막 순위) 날짜.** 확정 `trainingDate`와 분리 |
| `studentCount` | int \| null | 수강 인원 | 기관 신청 인원 |
| `classCount` | int \| null | (화면 미사용, 유지) | 학급 수 |
| `institutionName` | string | 기관명 | |
| `institutionSido` | string \| null | 기관 소재지 | 예: `부산광역시` |
| `institutionSigungu` | string \| null | 기관 소재지 | 예: `해운대구` |
| `institutionAddress` | string \| null | 기관 소재지 본문 | 도로명. 시/도·시군구와 중복되면 도로명만 |
| `institutionAddressDetail` | string \| null | 기관 소재지 | 상세 주소 |
| `institutionApplicationCount` | int \| null | 프로그램 신청 횟수 | 이 **기관**의 Gemini 찾아가는 연수 신청 누적 건수 |
| `institutionCompletedTrainingCount` | int \| null | 프로그램 수강 횟수 | 그 중 연수 완료(강사 매칭 + 연수일 경과) 건수 |
| `institutionJoinedAt` | date \| null | 등록일 | 기관(학교) 회원/조직 등록일. 신청 `submittedAt`과 다를 수 있다 |
| `submittedAt` | date-time \| null | (화면 등록일과 다름) | 이 신청 제출 시각 |
| `approvedAt` | date-time \| null | | 기관 신청 승인 시각 |
| `officialDocumentRequired` | boolean | 공문 필요 여부 | true → 화면 `필요`, false → `필요 없음`. 강사 매칭된 행에서만 섹션이 보인다 |
| `progressStatus` | enum \| null | 프로그램 진행 현황 | 아래 enum. FE는 날짜 파생을 유지할 수 있게 **원천 날짜를 빠뜨리지 마라.** `progressStatus`는 서버 배지용 |

`progressStatus` 값 (FE `GeminiApprovedTrainingStatus` 와 동일):

| 값 | 화면 |
|---|---|
| `SCHEDULED` | 프로그램 진행 예정 |
| `IN_PROGRESS` | 프로그램 진행 중 |
| `COMPLETED` | 프로그램 진행 완료 |
| `NOT_CONDUCTED` | 프로그램 미진행 |

파생 규칙 (FE `resolveApprovedTrainingStatus`, 오늘 0시 기준):

1. 강사 미매칭 + `lastPreferredDate` < 오늘 → `NOT_CONDUCTED`
2. 강사 미매칭 + 그 외 → `SCHEDULED`
3. 강사 매칭 + `trainingDate` > 오늘 → `SCHEDULED`
4. 강사 매칭 + `trainingDate` = 오늘 → `IN_PROGRESS`
5. 강사 매칭 + `trainingDate` < 오늘 → `COMPLETED`

`instructorName` 이 null이면 미매칭이다. 문자열 `"미지정"` 을 넣지 마라.

### 3. 담당 교사 (기관 신청의 교사 · LNB 「담당자 정보」가 아님)

섹션 제목은 **담당 교사 정보**. 소스는 기관 신청 스냅샷 또는 교사 회원.  
신청 양식 단락 id `gemini-vt-inst-seed-contact`.

개인정보(전화·이메일·자택·계좌)는 **이 상세 GET에서만**. 목록 item에 복사하지 마라.  
저장값이 마스킹돼 있으면 마스킹 문자열을 그대로 준다. FE는 재마스킹하지 않는다 (`displayServerPiiAsIs`).

| 필드 | 타입 | CMS 라벨 | 없으면 |
|---|---|---|---|
| `teacherMemberId` | int64 \| null | (내부) | 기존 `managerAdminId` 와 혼동 금지. 교사 회원 id |
| `teacherName` | string \| null | 성명 | 기존 목록 `managerName`과 **같은 사람** |
| `teacherGender` | string \| null | 성별 | `남` / `여` 또는 기존 회원 enum. 문서에 확정 값을 적어라 |
| `teacherBirthDate` | date \| null | 생년월일 | `YYYY-MM-DD` |
| `teacherPhone` | string \| null | 연락처 | |
| `teacherEmail` | string \| null | 이메일 | |
| `teacherSchoolName` | string \| null | 소속 | 예: `부산다온초등학교` |
| `teacherEmploymentStatus` | enum \| null | 소속 배지 | `ACTIVE` 재직중 · `ON_LEAVE` 휴직 · `TRANSFERRED` 전출. null이면 FE는 배지를 숨길 예정 |
| `teacherPosition` | string \| null | 직급 | |
| `teacherSubject` | string \| null | 과목 | |
| `teacherHomeAddress` | string \| null | 자택 주소지 | |
| `teacherScheduleChangeCount` | int \| null | 성명 옆 일정 변경 배지 | 0 또는 null이면 배지 없음 |

아래는 **화면 칸은 있으나 기관 신청 양식 seed에는 칸이 없다.** 교사 회원 프로필에 이미 있으면 투영하고, 없으면 `null`. 신청 폼에 새 입력을 만들지 마라.

| 필드 | CMS 라벨 |
|---|---|
| `teacherLectureExperience` | 강사 경력 |
| `teacherAccountBank` | 정산 계좌 은행 |
| `teacherAccountNumber` | 계좌번호 |
| `teacherAccountHolder` | 예금주 |
| `teacherInstructorFeeGrade` | 강사비 등급 |
| `teacherBusinessIncomeLabel` | 사업소득자 여부 |
| `teacherOneLineIntro` | 한 줄 소개 |

기존 스키마의 `managerName` / `managerAdminId` 는 **deprecated 별칭**으로 한 릴리스 유지해도 된다. 정본 이름은 `teacherName` / `teacherMemberId`.

### 4. 매칭된 강사 (「연수 담당 강사」표)

`instructorMemberId` 가 있을 때만 객체를 채운다. 없으면 `assignedInstructor: null`.

| 필드 | 타입 | 표 헤더 |
|---|---|---|
| `assignedInstructor.memberId` | int64 | |
| `assignedInstructor.name` | string | 신청 강사명 |
| `assignedInstructor.homeAddress` | string \| null | 자택 주소지 |
| `assignedInstructor.experienceYears` | int \| null | JA 강의 경력 (FE는 `N년`) |
| `assignedInstructor.grade` | string \| null | JA 평가 등급. 화면 값 `A등급` · `B등급` · `C등급` |
| `assignedInstructor.phone` | string \| null | 연락처 |
| `assignedInstructor.email` | string \| null | 이메일 |

공문 섹션은 `officialDocumentRequired` 만으로 충분하다. 「공문 필요 정보」문구는 FE 고정 카피라 필드를 추가하지 마라.

---

## 요구사항 P1 — 강사 신청 목록

승인 연수 상세 LNB **강사 신청 목록**. 시드 GVT-T-01~03 은 A-02(강사 매칭된 승인 연수)에 붙인다.

```http
GET /api/admin/gemini/trainings/approved/{approvedTrainingId}/instructor-applications?page=0&size=20
```

응답 envelope은 기관 신청 목록과 같다: `content` · `page` · `size` · `totalElements`.

`GeminiInstructorApplicationItem` 에 **추가**:

| 필드 | 타입 | CMS 컬럼 |
|---|---|---|
| `applicationId` | int64 | row id (기존) |
| `instructorName` | string | 신청 강사명 (기존) |
| `applicationStatus` | `PENDING` \| `APPROVED` \| `REJECTED` | 프로그램 승인 현황. 화면: 승인 대기 / 승인 완료 / 신청 반려 |
| `homeSido` | string \| null | 자택 주소지 |
| `homeSigungu` | string \| null | 자택 주소지 |
| `experienceYears` | int \| null | JA 강의 경력 |
| `grade` | string \| null | JA 평가 등급. `A등급` / `B등급` / `C등급`. 기존 `instructorFeeGradeSnapshot` 과 같으면 그 값을 `grade`에도 준다 |
| `phone` | string \| null | 연락처. **목록은 마스킹** (`010-****-0000`) |
| `email` | string \| null | 이메일. **목록은 마스킹** |
| `monthlyAssignmentCount` | int \| null | 배정횟수(월별). 해당 월 확정 배정 수 |

기존 필드 `instructorTypeSnapshot` · `distanceKm` · `longDistance` · `availableScheduleMemo` · 시각 필드는 유지. CMS 이 테이블은 안 쓴다.

Query (필터 UI가 이미 있음. 같은 PR이 어려우면 필드 투영만 먼저):

| query | 설명 |
|---|---|
| `instructorName` | 부분일치 |
| `homeSido` · `homeSigungu` | 자택 |
| `experienceYears` | 정수. `6+` 는 6년 이상 |
| `grade` | `A등급` 등 |
| `applicationStatus` | `PENDING` / `APPROVED` / `REJECTED` |

승인·반려는 **새 API를 만들지 말고** 기존을 써라. FE 클라이언트가 이미 호출한다.

- `POST /api/admin/gemini/trainings/instructor-applications/{applicationId}/approve`
- `POST /api/admin/gemini/trainings/instructor-applications/{applicationId}/reject` body `{ "reason": string }`

규칙 (CMS 버튼):

- 한 번에 **1명**만 승인. 이미 `APPROVED` 인 사람을 다시 고르면 「강사 변경」(기존 승인을 풀고 대기인 다른 사람을 승인하는 정책이면, 그 동작을 이 문서 완료 보고에 한 줄로 적어라)
- `REJECTED` 는 이 화면 버튼으로 승인할 수 없다
- 승인 성공 시 해당 승인 연수 상세의 `assignedInstructor` 와 목록 `instructorName` 이 그 강사로 바뀐다

---

## 기대 응답 예시

### 미매칭 (로컬 185334에 가깝게)

`GET /api/admin/gemini/trainings/approved/185334`

```json
{
  "id": 185334,
  "programId": 185002,
  "organizationApplicationId": 185334,
  "recruitmentId": 185002,
  "recruitmentTitle": "제미나이 아카데미 찾아가는 연수 모집",
  "progressStatus": "SCHEDULED",
  "institutionName": "부산다온초등학교",
  "institutionSido": "부산광역시",
  "institutionSigungu": "해운대구",
  "institutionAddress": "해운대로 123",
  "institutionAddressDetail": null,
  "institutionApplicationCount": 2,
  "institutionCompletedTrainingCount": 1,
  "institutionJoinedAt": "2024-03-01",
  "trainingDate": null,
  "trainingStartTime": null,
  "trainingEndTime": null,
  "trainingTimeText": null,
  "lastPreferredDate": "2026-10-14",
  "studentCount": 15,
  "classCount": 1,
  "officialDocumentRequired": false,
  "teacherMemberId": 88001,
  "teacherName": "홍길동",
  "teacherGender": "남",
  "teacherBirthDate": "1990-01-09",
  "teacherPhone": "010-****-0000",
  "teacherEmail": "ho***@school.kr",
  "teacherSchoolName": "부산다온초등학교",
  "teacherEmploymentStatus": "ACTIVE",
  "teacherPosition": "교사",
  "teacherSubject": "사회",
  "teacherHomeAddress": null,
  "teacherScheduleChangeCount": 0,
  "teacherLectureExperience": null,
  "teacherAccountBank": null,
  "teacherAccountNumber": null,
  "teacherAccountHolder": null,
  "teacherInstructorFeeGrade": null,
  "teacherBusinessIncomeLabel": null,
  "teacherOneLineIntro": null,
  "assignedInstructor": null,
  "submittedAt": "2026-09-20T10:00:00+09:00",
  "approvedAt": "2026-09-21T11:00:00+09:00",
  "updatedAt": "2026-09-21T11:00:00+09:00"
}
```

`teacherName` 이 지금 목록의 `테스트 마스터 관리자` 라면, 그건 **생성 관리자 이름을 담당 교사에 넣은 버그**다. 신청 교사 이름으로 고쳐라. 관리자 표시명으로 채우지 마라.

### 매칭 + 강사 신청 (시드 A-02)

`assignedInstructor` 예:

```json
{
  "assignedInstructor": {
    "memberId": 77002,
    "name": "홍길동",
    "homeAddress": "광주광역시 남구",
    "experienceYears": 3,
    "grade": "A등급",
    "phone": "010-****-0000",
    "email": "ho***@naver.com"
  },
  "trainingDate": "2026-09-30",
  "trainingTimeText": "15:30~16:40(2차시)",
  "officialDocumentRequired": true,
  "progressStatus": "IN_PROGRESS"
}
```

강사 신청 목록 예:

```json
{
  "content": [
    {
      "applicationId": 9101,
      "instructorName": "김틴토",
      "applicationStatus": "PENDING",
      "homeSido": "서울특별시",
      "homeSigungu": "강서구",
      "experienceYears": 1,
      "grade": "A등급",
      "phone": "010-****-0000",
      "email": "ki***@naver.com",
      "monthlyAssignmentCount": 10
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 3
}
```

---

## 시드

로컬/스테이징에 아래가 보여야 한다. id는 기존 Gemini 더미를 재사용하고, 완료 보고에 **실제 id**를 적어라.

| CASE | 상세에서 확인할 것 |
|---|---|
| GVT-A-01 | 강사 null · `lastPreferredDate` 미래 · `progressStatus=SCHEDULED` · 연수일시 null |
| GVT-A-02 | 강사 홍길동 · `trainingDate` 오늘 · `trainingTimeText=15:30~16:40(2차시)` · 강사 신청 T-01~03 |
| GVT-A-03 | 강사 매칭 · `trainingDate` 7일 전 · `COMPLETED` · `officialDocumentRequired=true` |
| GVT-A-04 | 강사 null · `lastPreferredDate` 5일 전 · `NOT_CONDUCTED` · 수강 인원 20 |
| 공통 | `institutionApplicationCount` · `institutionCompletedTrainingCount` · `institutionJoinedAt` · 교사 성명/연락처가 null이 아닌 샘플 1건 이상 |

교사 연락처 원문이 필요하면 스테이징 계정에만 두고, 목록 API 샘플에는 넣지 마라.

---

## OpenAPI

- path `GET /api/admin/gemini/trainings/approved/{approvedTrainingId}` 를 dashboard(및 CMS가 머지하는) spec에 추가
- `GeminiApprovedTrainingDetailResponse` 에 P0 필드와 description (필드 ↔ CMS 라벨)
- path `GET …/approved/{approvedTrainingId}/instructor-applications` 와 `GeminiInstructorApplicationItem` 확장
- operationId를 안정적으로 유지해 Orval이 깨지지 않게

---

## 하지 말 것

- 전화·이메일·계좌·상세 주소를 **승인 연수 목록** item에 추가
- `trainingDate` 하나에 확정일과 3지망 마지막일을 같이 넣기. `lastPreferredDate` 를 분리
- 빈 횟수를 `0`으로 채워 「데이터 있음」처럼 보이게 하기. 미집계는 `null`
- 담당 교사 이름에 로그인 관리자·생성 관리자 이름을 넣기
- GENERAL `GET /api/admin/programs/{programId}/instructor-applications` 스키마를 Gemini 표 컬럼에 맞춰 바꾸기. Gemini 전용 item만 확장
- 담당자(CMS 프로그램 매니저) API를 새로 만들기. `programId`만 돌려주면 된다
- FE mock 시드를 이 계약의 대체로 두기

---

## 완료 기준

- [ ] `GET /api/admin/gemini/trainings/approved/{id}` 가 목록에 있는 id로 200, 없는 id로 404
- [ ] 185334에 해당하는 행(또는 보고한 시드 id)의 상세에 기관 주소·신청/수강 횟수·등록일·교사 성명/연락처가 null이 아닌 값으로 내려온다. 횟수가 진짜 0이면 `0`도 허용하되, 필드 키는 반드시 있다
- [ ] 미매칭 행은 `trainingDate` null · `lastPreferredDate` 있음 · `assignedInstructor` null
- [ ] 매칭 행(A-02)은 `assignedInstructor.name` · `trainingTimeText` · `grade` 가 있다
- [ ] `programId` 가 모집 공고 id이고, 그 id로 기존 managers API가 404가 아니다 (담당자 0명이면 빈 목록 200)
- [ ] 강사 신청 GET이 A-02에서 T-01~03 세 건을 반환하고, 전화·이메일은 마스킹
- [ ] 목록 `GET …/approved` 응답 형태는 그대로 (개인정보 필드 추가 없음)
- [ ] handoff 문서에 확정 필드명·enum·시드 id·강사 변경 시 승인 API 동작을 기록

---

## FE 후속 (BE 완료 후 · 이번 작업 아님)

1. OpenAPI 머지 + Orval 재생성
2. `fetchGeminiApprovedTrainingDetailRemote` + `useGeminiApprovedTrainingDetail` 이 목록 캐시 대신 상세 GET을 사용
3. `mapGeminiApprovedTrainingRowToDetail` 의 `0` / `''` / `ACTIVE` 기본값을 응답 매핑으로 교체
4. `lastPreferredDate` 를 목록 `trainingDate` 복사에서 분리
5. 강사 신청 탭을 목록 GET에 연결. 승인 버튼은 기존 approve/reject 호출
6. 담당자 탭 `programId` 는 상세의 `programId` (approvedTrainingId 아님)

---

## 관련

- 목록 클라이언트: `apps/cms/src/features/program/gemini/api/visiting-training/client.ts` (`fetchGeminiApprovedTrainingsRemote`)
- 목록→상세 임시 매핑: `…/model/approved/approved-detail-resolver.ts`
- 상세 화면: `…/ui/approved/detail-program-info-tab.tsx` · `detail-instructor-application-tab.tsx` · `detail-fullpage-modal.tsx`
- 진행 현황 파생: `…/lib/approved/resolve-status.ts`
- 시드: `apps/cms/docs/api/be-handoff-program-dummy-seeds/06-gemini-dummy-seed.md` (A.3 승인 상세 레시피)
- 기존 갭 메모: `apps/cms/docs/api/programs-api-backend-gaps-consolidated.md` M-16
