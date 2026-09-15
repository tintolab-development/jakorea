# 1사1교 강사 배정 · 1일1교 충돌 — Backend API 요청 (FE → BE)

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-15 |
| 대상 | Admin CMS 1사1교 (`programType=COMPANY_SCHOOL`, Primary ONE-01/02/03 `170001`–`170003`) |
| FE 상태 | **mock 폴백 제거**. remote gate + Admin API만 사용 |
| 관련 OpenAPI | 로컬 `GET /v3/api-docs` 동기화 기준 (`apps/cms/openapi/backend.openapi.json`) |

---

## 0. 배경

FE는 아래 API로 강사 배정 보드·1일1교 충돌·배정 create를 연결했습니다.

| 용도 | 현재 사용 API |
|------|----------------|
| 배정 목록 | `GET /api/admin/program-execution/instructor-assignments?programId=` |
| 배정 생성 | `POST /api/admin/programs/{programId}/instructor-assignments` |
| 배정 취소 | `POST /api/admin/program-execution/instructor-assignments/{assignmentId}/cancel` |
| 강사 신청 | `GET /api/admin/programs/{programId}/instructor-applications` |
| 희망일정 | `GET /api/admin/organization-applications/{id}/requested-schedules` |
| 일정 | `GET /api/admin/programs/{programId}/schedules` |

**없는 것:** `instructor_assignment_calendar` 전용 GET.  
FE는 배정 목록 + `schedules.startAt` 날짜로 1일1교 점유일을 **유도**합니다. write 시 BE가 `ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT`(409)를 주면 그대로 안내합니다.

아래는 **화면을 mock 없이 완전 동작**시키기 위해 필요한 BE 보완입니다.

---

## 1. P0 — 배정 create와 희망일 매핑

### 문제

- 기관 희망일은 `requested-schedules.requestedDate` (최대 2건).
- 배정 create는 **`scheduleId`(program_schedule PK) 필수**.
- ONE-02에서 희망일만 있고 동일 날짜의 `program_schedule`이 없으면 FE가 배정 불가.

### 요청 (택1 이상)

#### 옵션 A (권장) — create 확장

`POST /api/admin/programs/{programId}/instructor-assignments`

```json
{
  "instructorMemberId": 170024,
  "organizationApplicationId": 170013,
  "instructorApplicationId": 170033,
  "requestedScheduleId": 12345,
  "scheduleLead": true
}
```

- BE가 `requestedScheduleId` → `program_schedule` upsert(또는 기존 매칭) 후 calendar claim.
- 응답에 `scheduleId` 포함.

#### 옵션 B — 조회 매핑 API

`GET /api/admin/organization-applications/{applicationId}/requested-schedules`

각 항목에:

```json
{
  "id": 12345,
  "preferenceOrder": 1,
  "requestedDate": "2026-09-12",
  "resolvedScheduleId": 9001
}
```

- `resolvedScheduleId`가 null이면 FE는 배정 버튼 비활성 + “일정 미생성” Empty.

### 수락 기준

- ONE-02 기관 C 희망 1지망일에 강사 배정 시 scheduleId를 FE가 추측하지 않아도 됨.
- 동일 강사·동일일·타기관 배정 시 409 + `ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT`.

---

## 2. P0 — Assignment list / calendar 조회 보강

### 문제

`InstructorAssignmentListItemResponse`에 화면 표시·충돌 UI에 필요한 필드가 부족합니다.

현재: `assignmentId`, `programId`, `scheduleId`, `organizationApplicationId`, `instructorMemberId`, `assignmentStatus`, `scheduleLead`, …

### 요청

#### 2-1. list item enrich (최소)

| 필드 | 타입 | 용도 |
|------|------|------|
| `lectureDate` | `date` (YYYY-MM-DD) | 1일1교 점유 (schedule join 없이) |
| `instructorName` | string | 배정 테이블 |
| `organizationName` | string | 배정/충돌 툴팁 |
| `distanceKm` | number? | 거리 표시 |
| `longDistance` | boolean? | 장거리 뱃지 |
| `homeAddress` | string? (마스킹 정책 준수) | 자택 주소 열 |

#### 2-2. (권장) Calendar 조회 API

`GET /api/admin/programs/{programId}/instructor-assignment-calendar`

```json
{
  "items": [
    {
      "instructorMemberId": 170024,
      "lectureDate": "2026-09-12",
      "organizationApplicationId": 170014,
      "assignmentId": 88,
      "activeYn": true
    }
  ]
}
```

- SSOT = `instructor_assignment_calendar` (시드/가드와 동일).
- FE 유도 로직 제거 가능.

### 수락 기준

- ONE-02 강사 D(한서연)가 기관 D 충돌일에 배정된 상태에서 기관 C 동일 희망일 행이 **배정 불가**.
- FE가 dashboard schedules에 의존하지 않아도 됨.

---

## 3. P1 — 참여 기관 ↔ organizationApplicationId

### 문제

진행현황 참여 기관을 `participants?participantType=ORGANIZATION`으로 받으면:

- `id` = `participantId`
- 강사 배정 create에는 **`organizationApplicationId`** 필요

FE는 `sourceApplicationId`를 `ParticipatingSchoolRow.organizationApplicationId`로 매핑 중이지만,  
`sourceApplicationType`/값 누락·기관명이 `memberName`인 경우가 있어 불안정합니다.

### 요청

택1:

1. **participants 응답**에 명시 필드  
   `organizationApplicationId`, `organizationName`, `organizationId`
2. 또는 1사1교 진행현황용  
   `GET /api/admin/programs/{programId}/organization-applications?status=APPROVED`  
   를 참여 기관 목록 SSOT로 문서화 (요청 스케줄 include 옵션)

### 수락 기준

- 기관 상세에서 `organizationApplicationId` 없이 배정 create가 막히지 않음.

---

## 4. P1 — 필요 배정 인원 · 대표강사

| 화면 | 필요 값 |
|------|---------|
| 배정 현황 분모 | `maxAssignableInstructors` (이미 serviceDetail/모집에 있음) 또는 org 단위 requiredCount |
| 대표강사 | `PUT /api/admin/programs/{programId}/representative-instructor` 존재 — 응답/목록에 `scheduleLead` 반영 확인 |

요청: org 단위 `requiredInstructorCount`가 있으면 list/detail에 노출. 없으면 FE는 프로그램 모집 `maxAssignableInstructors` 사용.

---

## 5. P2 — 에러 계약 고정

| code | HTTP | FE 메시지 |
|------|------|-----------|
| `ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT` | 409 | 동일 강사는 하루 한 학교만 배정할 수 있습니다. (1일1교) |

요청: OpenAPI/error catalog에 코드·메시지를 명시하고, body shape를  
`{ "error": { "code": "...", "message": "..." } }` 로 통일.

---

## 6. FE가 더 이상 하지 않는 것

- `economy-prog-*` / `MOCK_PARTICIPATING_*` 로 1사1교 목록·진행·배정 채우기
- 해시 기반 “가짜 슬롯 충돌”
- 희망일정 없는 경우 임의 `WAITING_HOPE_DATES` 생성

Remote 필수 env:

```env
VITE_API_SERVER=http://localhost:8080
VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true
VITE_REAL_API_MODULES=...,programs,applications,programProgress,...
```

---

## 7. 검증 시나리오 (ONE-02)

1. 목록에 `170002`만(또는 Primary 3건) 노출  
2. 기관 C: 희망 1·2지망 API 행 표시  
3. 강사 A 대표 / B 장거리 일반 배정 표시  
4. 강사 D: 기관 D 충돌일 점유 → 기관 C 동일일 **배정 불가**  
5. 강사 C: APPROVED·미배정 Empty  
6. 배정 create 성공 시 목록 재조회, calendar/list와 UI 일치  

문의 시 이 문서 + `docs/api/company-school-primary-fe-adapter-2026-09-15.md`를 함께 전달하면 됩니다.

---

# Appendix A — 일반 / UJAT / Gemini / TT / shared mock 제거 잔여 (FE → BE)

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-15 |
| 목적 | 1사1교와 동일하게 **mock 폴백 없이** CMS 프로그램 화면을 Admin API만으로 동작시키기 위한 잔여 요청 |
| FE 상태 | 1사1교 list/detail/assignment = API-only. 일반·UJAT CRUD/신청·Gemini 모집/실적 list·TT list/org = API-only로 전환. **UJAT 교육진행 보드·일부 enrich**는 BE 선행 필요 |
| 관련 OpenAPI | `apps/cms/openapi/backend.openapi.json` (로컬 `/v3/api-docs` 동기화) |

---

## A0. 공통 FE 정책 (이미 적용)

- Remote gate OFF 또는 JWT/`VITE_REAL_API_MODULES` 미충족 시: **mock seed로 채우지 않음** → Empty 또는 `assertRemoteReady` throw.
- 의도적 0건(Primary 시드)은 Empty UI. mock로 “데모 행”을 넣지 않음.

---

## A1. P0 — 일반 프로그램 진행현황 (participants enrich)

### 문제

FE progress hooks는 mock 폴백을 제거했습니다. list 응답만으로 테이블이 완성되어야 합니다.

### 현재 사용 API

| 용도 | API |
|------|-----|
| 참여 기관 | `GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION` |
| 참여 강사 | `…?participantType=INSTRUCTOR` |
| 참여 봉사자 | `…?participantType=VOLUNTEER` |
| 개인 참여자 | participants INDIVIDUAL |

### 요청 (list item enrich)

| 필드 | 용도 |
|------|------|
| `organizationApplicationId` / `sourceApplicationId` | 기관 상세·배정 |
| `organizationName` (memberName 금지) | 테이블 |
| `assignedInstructorNames[]` / count | 담당 강사진 |
| `textbookStatus` | 교재현황 |
| `settlementStatus` | 강사 정산 |
| `educationGrade`, `lectureRound` | 필터 |
| `distanceKm`, `longDistanceYn` | 강사 거리 (shared 해시 mock 제거) |

### 수락 기준

- general progress gate ON → mock 파일 import 없이 목록·필터·상세 진입.
- gate OFF → 빈 목록(데모 행 0).

---

## A2. P0 — UJAT 교육 진행 (상·하반기) 보드 API

### 문제

LNB `education_progress` 전 탭이 `data/mock/ujat-education-progress-*-mock` + region local store입니다.  
OpenAPI에 temporary-schedule / region-capacities / partner-assignments / attendance-manager는 있으나, **CMS 보드용 조회 SSOT**가 문서·응답에 없음.

### 요청 (택1 이상 · 권장 = 보드 전용 GET)

#### A2-1. 참여 기관 (반기)

`GET /api/admin/program-execution/programs/{programId}/ujat/education-progress/institutions?half=H1|H2`

필요 필드 예: `organizationApplicationId`, `institutionName`, `regionKey`, `teacherName`, `educationScheduleIsoDates[]`, `classCount`, `assignmentStatus`, `textbookStatus`.

#### A2-2. 참여 봉사자 (반기)

`GET …/ujat/education-progress/volunteers?half=`

필요 필드: `volunteerApplicationId`/`participantId`, `name`, `grade`, `regionKey`, `assignmentStatus`, `assignedClassCount`, `hours1365`, `withdrawnYn`.

#### A2-3. 출석 보드

`GET …/ujat/education-progress/attendance?half=&regionKey=`  
`PUT /api/admin/program-schedules/{scheduleId}/attendances` (기존)와 세션 id 매핑 문서화.

응답: 세션 그룹(`isoDate`, `scheduleId`, `institutionName`) + volunteer rows(`status`: PRESENT/ABSENT/LATE/GIVE_UP).

#### A2-4. 과제 보드

`GET …/ujat/education-progress/assignments?half=&regionKey=`  
제출상태·formResponseId·미리보기 가능 여부.

#### A2-5. 진행 요약 매트릭스

`GET …/ujat/education-progress/summary?half=`  
지역 × (학교 수 / 학급 수 / 봉사자 수 / 출석률 / 과제제출률) + H1/H2/합계.

#### A2-6. 지역 배정 매트릭스

기존:

- `GET/POST …/ujat/partner-assignments*`
- `GET/PUT …/ujat/region-capacities`
- `GET/PUT …/ujat/planning-estimates`

**추가 요청:** CMS 교차표용

`GET /api/admin/program-execution/programs/{programId}/ujat/region-assignment-board?half=&regionKey=`

셀: `scheduleId`, `organizationApplicationId`, `classLabel`, `primaryParticipantId`, `secondaryParticipantId`, `attendanceManagerYn`, `blockedYn`.

### 수락 기준

- Primary UJAT에서 교육진행 탭이 mock 없이 렌더.
- FE `ujat-education-progress-*-mock` / `region-assignment-store` 시드 불필요.

---

## A3. P1 — UJAT 선발·면접·일정

### 문제

기관/봉사자 **목록 GET**은 applications remote API-only로 전환했으나, 면접 일정·2차 면접 상태 PATCH·스케줄 확정 extras가 mock입니다.

### 요청

| 용도 | API |
|------|-----|
| 면접 슬롯(반기) | `GET/PUT /api/admin/programs/{programId}/ujat/volunteer-interview-slots?half=` — recurringUnavailable, availableTimeSlots, holidays |
| 서류/면접 상태 | volunteer-application status PATCH 계약을 OpenAPI에 명시 (문서합격·면접배정·2차합불) |
| 기관 스케줄 확정 상세 | temporary-schedule 응답에 확정 extras(안내문·강사배정 인원) 포함 |

### 수락 기준

- `ujat-volunteer-interview-schedule` mock / `patchUjatVolunteerSecondInterviewScreeningStatus` mock 불필요.

---

## A4. P0 — Gemini 모집 / 승인 / 실적 (응답 보강)

### 현재 OpenAPI (사용 가능 · FE list는 API-only)

| 용도 | API |
|------|-----|
| 모집 목록/CRUD | `/api/admin/gemini/trainings/recruitments` |
| 기관 신청 | `…/recruitments/{programId}/organization-applications` + approve/reject |
| 강사 신청 | `…/recruitments/{programId}/instructor-applications` + approve/reject |
| 승인 연수 | `…/approved`, `…/approved/{approvedTrainingId}`, bulk-delete |
| 실적 | `…/training-reports` + import/preview/bulk-delete |

### 요청

1. `GET …/approved/{approvedTrainingId}`에 CMS LNB용 필드: 기관명, 연수일, 진행현황 집계, linked `programId`/`recruitmentId`.
2. `GET …/instructor-applications` list item: 이름, 연락처(마스킹), 상태, 신청일 — FE 테이블 컬럼과 1:1.
3. (선택) 모집 상세에 Platform 미리보기 URL 또는 publishStatus.

### 수락 기준

- Gemini 모집/승인/실적 gate ON → mock store subscribe 없이 RQ만.
- 승인 상세 강사신청 탭 = instructor-applications API.

---

## A5. P1 — 교육받은 교사 (TT)

### 문제

list/detail/org는 API-only로 전환. 희망일정/일지 preview enrich가 부족하면 화면 일부 Empty.

### 요청

| 용도 | API/필드 |
|------|----------|
| 기관 신청 상세 | preferred schedule blocks (`requestedDate`/`timeRange`/회차) |
| 교육일지 | Admin list + download(presign) — portal-only면 Admin GET 추가 |
| participants | TT surface용 `organizationName`/`organizationApplicationId` (일반 A1과 동일) |

### 수락 기준

- `trained-teachers-programs` / `trained-teachers-institution-detail` mock seed 없이 상세·일지 동작.

---

## A6. P1 — shared / 일반 잔여

| 갭 | 요청 |
|----|------|
| 강사↔기관 거리 | applications/assignments 응답에 `distanceKm` 필수화 → FE 해시 mock 삭제 |
| 개인 참여자 과제 | `GET/PUT …/programs/{programId}/participant-assignments` (또는 form-response 집계) |
| 신청자 상세 편집 | `PATCH /api/admin/…-applications/{id}` 필드 화이트리스트 |
| 설문 poll raw | Admin poll responses list (UJAT·general 공유) |
| 급여/정산 보드 | 일반 progress 하위 wage/settlement Admin API |

---

## A7. FE가 더 이상 하지 않을 것 (목표)

- `MOCK_PARTICIPATING_*` / `MOCK_APPLICANT_*` 로 일반·shared 목록 채우기
- `ujat-education-progress-*-mock`, region-assignment local seed (BE A2 완료 후)
- Gemini `model/*/mock.ts` store를 gate OFF 폴백으로 사용
- TT `getTrainedTeachersPrograms()` list 폴백
- 거리·희망일·면접슬롯 해시/하드코딩

Remote 예시:

```env
VITE_API_SERVER=http://localhost:8080
VITE_REAL_API_MODULES=...,programs,ujatPrograms,applications,programProgress,geminiVisitingTraining,geminiPerformance,trainedTeacherPrograms
```

문의 시 본 Appendix + `company-school-primary-fe-adapter-2026-09-15.md` + `ujat-primary-case-fe-adapter-2026-09-15.md`를 함께 전달하면 됩니다.
