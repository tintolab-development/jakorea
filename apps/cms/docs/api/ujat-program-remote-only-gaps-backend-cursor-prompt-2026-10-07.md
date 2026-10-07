# Cursor prompt — UJAT 프로그램 remote-only 잔여 계약 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/ujat-program-remote-only-gaps-backend-cursor-prompt-2026-10-07.md`

> CMS UJAT 프로그램 목록·풀페이지·LNB 목록·LNB 상세·필터 조회에서 FE 시드 mock을 제거했다.
> 화면은 아래 Admin API 응답만 그린다. 응답에 없는 값은 `-` / 빈 칸 / 0(인원 분해 불가)으로 두고, 더 이상 서울·1학년·학급별 균등 인원·2026 금요일·mock 오늘을 넣지 않는다.
> 아래 항목이 비어 있으면 해당 필터·컬럼·상세가 비거나 조회가 현재 페이지에만 적용된다.

범위: **UJAT 프로그램만.** 일반·1사1교·Gemini 계약을 바꾸지 마라.

---

## 이미 쓰는 API (변경하지 말 것)

| 화면 | 호출 |
| --- | --- |
| 프로그램 목록·상세 | Admin programs GET. remote 게이트 OFF면 빈 화면 |
| 학교 신청 목록 | `GET /api/admin/programs/{programId}/organization-applications` |
| 봉사자 서류·서류합격·면접 | `GET /api/admin/programs/{programId}/volunteer-applications` |
| 교육 일정 열·필터 | `GET /api/admin/programs/{programId}/schedules` + 프로그램 overlay 반기 |
| 임시 배정 저장 | temporary-schedule PUT (기존) |
| 지역 일 최대 학급 수 | region-capacities. 없으면 문구 자체를 숨김 |
| 진행 요약 | 전용 summary API 없음. 승인 기관 신청 + `finalResultStatus=APPROVED` 봉사자를 프론트가 집계 |
| 설문 | 기존 설문 바인딩·응답. remote OFF면 등록 불가 |

목록 query로 **이미 보내는 값** (`ApplicationsListQuery`):

`keyword`, `status`, `documentStatus`, `interviewStatus`, `finalResultStatus`, `isReparticipation`, `managerAEvaluation`, `managerBEvaluation`, `recruitHalf` (`FIRST_HALF` | `SECOND_HALF`).

기관 임시배정 status 매핑: `PENDING` / `TEMP_ASSIGNED` / `TEMP_REJECTED` / `REJECTED`.  
목록 항목의 `temporaryAssignmentStatus`를 `applicationStatus`보다 우선해 읽는다. 이 필드가 null이면 신청 상태만으로 임시배정을 구분하지 못한다.

---

## 요청

각 항목은 **기존 목록·상세 응답에 필드를 추가**하거나, **기존 list query에 파라미터를 추가**하라. 새 mock·시드 화면을 만들지 마라. 필드가 없으면 null. 추측 값을 넣지 마라.

### 1. 봉사자 목록 필터 — query + 목록 항목

`GET …/volunteer-applications` 에 아래 query를 추가하고, 목록 항목에도 같은 값을 내려라.  
지금은 OpenAPI `VolunteerApplicationListItemResponse`에 학년·희망지역·교육경험이 없다. 프론트는 없으면 학년 `''`, 희망지역 `''`, 교육경험 `null`로 두고, 「없음」 필터에 넣지 않는다.

| query | 목록 필드 | 값 |
| --- | --- | --- |
| `grade` | `grade` | `1학년` `2학년` `3학년` `4학년` `졸업` `휴학` `졸업유예` |
| `preferredRegion` | `preferredRegion` | UJAT 교육 지역 **라벨** (예: `서울`). 코드가 있으면 `preferredRegionCode`도 |
| `hasEducationExperience` | `hasEducationExperience` | boolean. 미응답은 null. false로 채우지 말 것 |
| `assignedInterviewDate` | 기존 `assignedInterviewStartAt` | `YYYY-MM-DD` (KST). 면접일 필터 |
| `totalScore` | 기존 `interviewEvaluations[].score` 합 | 숫자. 2차 면접 총점 필터 |

`keyword`는 봉사자명 부분 일치로 유지하라. 학년·지역·교육경험·면접일·총점은 keyword로 대체하지 마라.

### 2. 기관 신청 목록 필터

`GET …/organization-applications`

| query | 의미 |
| --- | --- |
| `keyword` | 지금처럼 기관명 **또는** 교사명 부분 일치. 둘을 동시에 다르게 걸 수 있게 `organizationName`, `teacherName`을 분리하면 더 맞다 |
| `requestedClassCount` | 총 학급 수 일치 |
| `educationRegionCode` | 교육 지역 코드. 목록의 `regionSido`+`regionSigungu`만으로는 교육 지역 탭과 어긋난다 |
| `scheduleDate` | `YYYY-MM-DD`. 해당 일정에 배정된 기관만 |

목록 항목에 **`educationRegionCode`**(UJAT 교육 지역 키)를 추가하라.  
지금은 `regionSido` / `regionSigungu`가 교육 지역 라벨과 맞지 않으면 프론트가 **`서울`로 넣는다.** 이 폴백은 잘못된 지역 탭·필터를 만든다. 코드를 주면 프론트는 그 값만 쓰고, 매칭 실패 시 `서울`로 채우지 않는다.

`temporaryAssignmentStatus`는 임시배정 화면의 상태 필터 SSOT로 유지하라. `applicationStatus`와 다를 때 임시배정 값이 우선이다.

### 3. 기관 신청 상세 — 학급·연락·희망일

`GET /api/admin/organization-applications/{id}`

지금 프론트가 채우지 않는 값:

| 필드 | 현재 | 필요 |
| --- | --- | --- |
| 교사 일반 전화 | 상세에 `teacherPhone`(휴대)만 있음 | `teacherTel` 또는 동등 필드. 없으면 null |
| 희망 교육일 | 없음 | `preferredEducationDates: YYYY-MM-DD[]` |
| 학년별 학급·학급별 학생 수 | `requestedClassCount`, `requestedStudentCount`, `grade`만 있음 | `gradeBlocks[]`: `{ gradeLabel, classCount, classes: [{ classNo, studentCount }] }` |
| 수업 시간표 | 없음 | `classTimeRows[]`: `{ gradeRangeLabel, periods: [string, string, string, string] }` |

`requestedStudentCount`를 학급 수로 나눠 학급별 인원을 만들지 마라. 학급별 값이 없으면 `classes`를 빈 배열로 두고 총원만 내려라. 프론트는 학급이 1개일 때만 총원을 그 학급에 넣고, 2개 이상이면 학급별 인원을 0으로 둔다.

### 4. 일정 확인·강사 배정 수

일정 확인 목록은 `status=TEMP_ASSIGNED` 기관 신청 + 프로그램 schedules로 그린다.

| 필요 | 설명 |
| --- | --- |
| 일정 확인 상태 | 화면 값 `institution_checking` \| `institution_confirmed` \| `approval_completed` \| `revision_requested` \| `application_rejected`. 상태 필드가 없어 프론트 stub는 항상 `institution_checking`이다. 목록 항목 `scheduleConfirmStatus`를 주면 stub를 제거한다 |
| 배정 강사 수 | 기관 승인 완료 문구의 「현재 배정 강사 N명」. 신청 id 기준 배정 강사 수. 없으면 0이 아니라 null |

### 5. 교육 진행 요약·1365·출석 시간

진행 요약의 **운영 학생 수**는 목록 DTO에 없어 셀을 비운다.  
지역별 운영 학교 수·학급 수는 승인 기관 신청의 `requestedClassCount`로만 집계한다.

1365 미리보기는 봉사자 진행 행(이름·지역)과 프로그램 일정 날짜만 쓴다. 아래가 없으면 `-`다.

| 필드 | 쓰임 |
| --- | --- |
| `birthDate` | 1365 생년월일 |
| `id1365` | 1365 ID |
| 세션별 출석 시간(분) | 지각이 아니면 시간을 만들지 않음. 출석 응답에 `durationMinutes` 또는 등가 필드 |
| 발대식 참석 | 없으면 `-` |

학생 수·1365 시간·발대식을 프론트 상수로 채우지 마라.

### 6. 공휴일

면접 캘린더·불가일 UI는 2026년 공휴일 상수(`getMockHolidayDateKeys`)를 아직 공유 코드에서 쓴다. UJAT 면접 배정 파서는 그 상수를 더 이상 쓰지 않고 공휴일 집합을 비운다.

`GET` 공휴일(연도 또는 기간 → `YYYY-MM-DD[]`, KST)을 추가하거나, 기존 공휴일 API 경로를 이 문서에 적어 달라. 없으면 공휴일 제외가 동작하지 않는 것이 맞다.

### 7. 봉사자 모집 「공지 노출」

프로그램 정보 수정 화면의 `noticeExposureSetting`은 API 필드가 없어 항상 미설정이다.  
읽기는 `generalCommonInfo.volunteerRecruitmentInfo.noticeExposureTiming`만 본다.

저장·조회 키 이름과 허용 값(기존 프론트 옵션과 동일)을 확정해서 `config` 또는 recruitment 설정에 넣어라. 키를 정하기 전에는 프론트가 값을 만들지 않는다.

---

## 완료 보고

1. 추가·변경한 query 파라미터와 응답 필드 (null 규칙 포함).
2. `temporaryAssignmentStatus`와 `applicationStatus` 우선순위.
3. 학급별 학생 수를 총원 나눗셈으로 만들지 않았다는 확인.
4. 공휴일 API 경로. 없으면 「없음」이라고 적을 것.
5. 공지 노출 설정 키 이름과 허용 값.
6. 일반·1사1교·Gemini 핸들러를 건드렸는지. 건드렸으면 되돌릴 것.
