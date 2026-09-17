# BE 수정 요청 — UJAT 프로그램 상세 LNB API 계약 보강

**작성일:** 2026-09-17  
**상태:** ⏳ BE 요청 (FE 일부 연동 완료 · 잔여 갭)  
**우선순위:** P0(반기·임시배정 스키마) → P1(교육 진행 execution) → P2(OpenAPI 스키마 채우기)  
**대상 화면:** CMS `/programs/ujat?programId=…` 풀페이지 상세  
**범위:** `features/program/ujat/**` only (일반·1사1교·Gemini 간섭 금지)  
**FE gate:** JWT + `VITE_REAL_API_MODULES`에 `programs,ujatPrograms,applications` (+ 설문은 `formsSurveys` / programs surface remote)  
**관련 문서:**
- [programs-ujat-api-backend-handoff.md](./programs-ujat-api-backend-handoff.md)
- [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md)
- [ujat-primary-case-fe-adapter-2026-09-15.md](./ujat-primary-case-fe-adapter-2026-09-15.md)
- [programs-ujat-education-regions-api-backend-handoff.md](./programs-ujat-education-regions-api-backend-handoff.md)

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS UJAT 프로그램 상세(`/programs/ujat?programId=…`) FE 연동 중, **OpenAPI에 path만 있고 request/response schema가 비어 있거나**, **상·하반기(half) 필터가 없어** 화면을 서버 데이터로 완성하지 못하는 구간이 남았습니다.

FE는 mock 시드 없이 remote만 사용합니다. 아래 계약을 OpenAPI + 런타임에 채워 주시면 FE가 이어서 붙입니다.

### 이미 FE가 remote로 붙인 것 (참고 · 깨지지 않게 유지)

| 영역 | API / 동작 |
|------|------------|
| 봉사자 상·하반기 목록 | `GET …/programs/{id}/volunteer-applications` + `keyword`·`documentStatus`·`interviewStatus`·`finalResultStatus`·`managerA/BEvaluation`·`isReparticipation` |
| 봉사자 mutation | document-result / document-evaluations / final-result / give-up / interview assign |
| 기관 신청 목록 | `GET …/programs/{id}/organization-applications` + `keyword`·`status` |
| 기관 상세·임시반려 | detail GET + approve/reject + `…/ujat/…/temporary-rejections` |
| 교육 진행 · 참여 기관/봉사자 목록 | 각각 `status=APPROVED` / `finalResultStatus=APPROVED` 목록으로 **임시 hydrate** (execution 전용 API 아님) |
| 설문 관리 | 공통 `…/programs/{id}/surveys` + form-bindings create/delete + responses/summary |

### P0 — 반드시 필요

1. **상·하반기(half) 필터**
   - `GET /api/admin/programs/{programId}/volunteer-applications`
   - `GET /api/admin/programs/{programId}/organization-applications` (해당 시)
   - query 추가 예: `recruitHalf=FIRST_HALF|SECOND_HALF` **또는** `recruitmentId={id}`
   - 목록 item에도 동일 필드 echo (`recruitHalf` / `recruitmentId`)
   - FE UI는 LNB `volunteer_h1` / `volunteer_h2`, 교육 진행 `edu_h1_*` / `edu_h2_*`로 반기를 나눔. 현재는 **동일 목록을 half만 스탬프**하는 workaround.

2. **기관 임시 일정/학급 배정 — request/response schema 채우기**
   - `GET|PUT /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/temporary-schedule`
   - `GET /api/admin/programs/{programId}/ujat/organization-schedule-assignments`
   - `POST …/schedule-change-request` (임시배정 확인 · 수정 요청)
   - 현재 OpenAPI는 summary + `200 OK`만 있고 **body/schema 없음** → codegen·클라이언트 생성 불가.
   - FE가 저장하려는 최소 필드:
     - `isoDate` (교육일)
     - `gradeClassSections[]` (학년·반)
     - `regionCode` / `educationRegionCode`
     - `semesterType`: `FIRST_HALF` | `SECOND_HALF`
     - `maxClassesPerDay` (지역 산정과 연동 시)
   - 목록 `status`에 `TEMP_ASSIGNED` / `TEMP_REJECTED` (또는 동등 enum)를 **필터·응답 모두** 지원.

3. **임시 배정 산정값 · 지역 정원** (path는 있음 · 런타임 검증 + OpenAPI 유지)
   - `GET|PUT /api/admin/program-execution/programs/{programId}/ujat/planning-estimates`
   - `GET|PUT /api/admin/program-execution/programs/{programId}/ujat/region-capacities`
   - `semesterType` + `educationRegionCode` 키로 FE 지역 탭과 매칭.

### P1 — 교육 진행 현황 (현재 FE는 신청 APPROVED로만 목록 hydrate)

다음 CMS 탭을 **program-execution UJAT API**로 채울 수 있게 request/response schema + 샘플 시드를 주세요.

| CMS 탭 | 기대 API (OpenAPI path 존재 · schema 빈약) |
|--------|---------------------------------------------|
| 지역별 배정 Matrix | `GET …/ujat/allocation-matrix` |
| 봉사자 파트너 배정 | `GET|POST …/schedules/{scheduleId}/ujat/partner-assignments` · `…/partner-assignments:auto` · cancel |
| 직접 배정 | `…/education-slots/{id}/direct-assignment(-candidates)` |
| 출석 | `GET …/schedules/{scheduleId}/attendances` · `POST …/attendances:bulk-upsert` · attendance-manager |
| 불참/불가 | `…/ujat/schedules/{scheduleId}/unavailability` |
| 활동 지역 변경 | `PATCH …/ujat/volunteers/{participantId}/activity-region` |

필요 쿼리/필드:
- `semesterType` 또는 `recruitHalf` (상·하반기)
- `educationRegionCode` (FE 교육 지역 마스터 코드와 동일)
- scheduleId / educationSlotId / assignmentGroupId / participantId 의 목록→상세 연결 키

### P2 — OpenAPI 스키마 정리

- 위 path들 **전부** `requestBody` / `200 content.schema` / 에러 코드 문서화
- codegen이 DTO를 생성할 수 있을 정도로 properties 필수
- `OrganizationApplicationListItemResponse` / `VolunteerApplicationListItemResponse`에 FE가 이미 읽는 enrichment 필드 유지·명시:
  - 기관: region · gradeClassCounts · teacherName · status
  - 봉사: preferredRegion · grade · contact · email · interviewAvailability · managerA/B · scores · assignedInterview*

### 수락 기준

- [ ] 상반기/하반기 LNB에서 서로 **다른** 신청 집합이 내려옴 (동일 프로그램 primary case로 검증)
- [ ] 임시배정 PUT → GET round-trip 후 CMS「임시 배정」「임시 배정 확인」화면에 학급·일자가 복원됨
- [ ] `status=TEMP_ASSIGNED` 목록 필터가 동작
- [ ] allocation-matrix / attendances / partner-assignments가 빈 `{}`가 아닌 typed JSON
- [ ] OpenAPI 스냅샷을 CMS `openapi/backend.openapi.json`에 동기화 가능

### 참고 FE 경로

- 신청 목록 쿼리 빌더: `apps/cms/src/features/program/ujat/api/applications-list-query.ts`
- 임시배정 UI: `…/application-institution/schedule-assign/**`, `schedule-confirm/**`
- 교육 진행: `…/progress/**` (institutions/volunteers는 APPROVED hydrate, attendance/region/assignments는 API unavailable)
- 설문: `ujat-program-detail-fullpage-modal.tsx` → general surveys/form-bindings hooks
````

---

## 1. FE 현재 연동 상태 (2026-09-17)

| LNB / 하위 | remote | 비고 |
|------------|--------|------|
| 기본 정보 · 담당자 · 모집 양식 | ✅ (programs CRUD / managers / templates) | 기존 |
| 신청 기관 · 목록·상세·승인/반려·임시반려 | ✅ | `status`·`keyword` 서버 필터 |
| 신청 기관 · 임시 배정 / 확인 | ⚠️ 목록 seed만 | PUT/GET schema 공백 → 배정 본문은 로컬 draft |
| 봉사자 상·하반기 · 서류1 / 합격자 / 면접2 | ✅ | 필터→API 재조회 · mutations remote |
| 봉사자 · 면접 일정 배정 | ✅ | `assignGeneralVolunteerInterview` 재사용 |
| 교육 진행 · 참여 기관 / 봉사자 | ⚠️ | APPROVED 신청으로 hydrate (execution 아님) |
| 교육 진행 · 출석 / 배정 / 지역 / 요약 | ❌ | OpenAPI path thin stub · FE unavailable toast |
| 설문 관리 (설문·만족도·강의평가) | ✅ | 공통 surveys + form-bindings |

게이트 OFF 시 mock 폴백 **없음** (`program-no-fe-mock`).

---

## 2. P0 상세 — 상·하반기 필터

### 배경

UJAT는 봉사·교육 진행을 **상반기(`h1`) / 하반기(`h2`)** LNB·탭으로 분리합니다.  
OpenAPI `listVolunteerApplications` / 기관 목록에는 `documentStatus` 등은 있으나 **`recruitHalf` / `semesterType` / `recruitmentId` query가 없습니다.**

FE workaround: 동일 remote 목록을 가져와 row에 `half`만 스탬프 → **상·하반기 데이터가 섞여 보이거나 중복**됩니다.

### 제안 계약 A (권장) — enum 필터

```http
GET /api/admin/programs/{programId}/volunteer-applications?recruitHalf=FIRST_HALF&page=0&size=20
GET /api/admin/programs/{programId}/organization-applications?recruitHalf=FIRST_HALF&status=TEMP_ASSIGNED
```

| query | enum | FE 매핑 |
|-------|------|---------|
| `recruitHalf` | `FIRST_HALF` \| `SECOND_HALF` | UI `h1` / `h2` |

목록 item:

```json
{
  "applicationId": 123,
  "recruitHalf": "FIRST_HALF",
  "recruitmentId": 456
}
```

### 제안 계약 B — recruitmentId

프로그램 detail에 상·하반기 `recruitmentId`를 내려주고, 목록은 `?recruitmentId=`로 필터.  
FE는 detail에서 id를 읽어 목록 query에 전달.

### 수락

Primary case(예: `182101`–`182105`)에서 H1/H2 시드가 **서로 다른 applicationId 집합**으로 분리되어 조회될 것.

---

## 3. P0 상세 — 임시 일정/학급 배정 schema

### 현재 OpenAPI (문제)

```
GET|PUT /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/temporary-schedule
GET    /api/admin/programs/{programId}/ujat/organization-schedule-assignments
POST   /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request
```

→ summary + `200 OK`만 존재. **requestBody / response schema 없음.**

### FE UI가 필요로 하는 최소 PUT body (제안)

```json
{
  "semesterType": "FIRST_HALF",
  "educationRegionCode": "SEOUL",
  "days": [
    {
      "isoDate": "2026-04-10",
      "maxClassesPerDay": 4,
      "assignments": [
        {
          "grade": 3,
          "classNumber": 2,
          "sectionLabel": "3학년 2반"
        }
      ]
    }
  ]
}
```

### GET 응답

PUT와 동일 구조 + `updatedAt`, `status` (`DRAFT` | `TEMP_ASSIGNED` | `CONFIRMED` | `REVISION_REQUESTED`).

### 목록 status

| UI | 기대 `status` (query + item) |
|----|------------------------------|
| 검토 대기 | `PENDING` |
| 임시 배정 | `TEMP_ASSIGNED` (별칭 `TEMPORARY_ASSIGNED` 허용 가능) |
| 임시 반려 | `TEMP_REJECTED` |
| 신청 반려 | `REJECTED` |
| 최종 승인(교육 진행) | `APPROVED` |

FE는 임시 배정/확인 목록을 `status=TEMP_ASSIGNED`로 조회합니다. **서버가 이 값을 모르면 목록이 비거나 PENDING과 혼재**합니다.

### 일정 수정 요청

```http
POST …/schedule-change-request
```

```json
{
  "reason": "학급 수 변경 요청",
  "requestedDays": [ /* temporary-schedule days와 동일 형태 */ ]
}
```

---

## 4. P1 상세 — 교육 진행 (program-execution)

OpenAPI에 UJAT execution path는 다수 존재하나, 대다수가 **빈 200**입니다. FE는 출석·지역 Matrix·파트너 배정 탭에서 API unavailable을 띄웁니다.

### 우선 구현 순서 (FE 소비 예정)

1. `GET …/ujat/allocation-matrix?semesterType=FIRST_HALF`  
2. `GET …/ujat/region-capacities` / planning-estimates (이미 스키마 일부 있음 — 런타임·시드 검증)  
3. `GET …/schedules/{scheduleId}/attendances` + bulk-upsert  
4. partner-assignments CRUD / auto / cancel  
5. direct-assignment + candidates  
6. unavailability · attendance-manager · activity-region PATCH

### scheduleId 발견

목록→상세 연결을 위해 다음 중 하나 필요:

- allocation-matrix cell에 `scheduleId` / `educationSlotId` 포함, 또는  
- `GET …/ujat/organization-schedule-assignments`가 기관·일자·scheduleId를 반환

FE는 현재 금요일 교육일 캘린더(`UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES`)를 UI 상수로 둡니다. **서버가 isoDate↔scheduleId 맵을 주면** 상수 의존을 줄일 수 있습니다.

---

## 5. P2 — DTO enrichment (목록 어댑터가 이미 기대)

`VolunteerApplicationListItemResponse` / 기관 list item에 FE 어댑터가 읽는 필드(없으면 `-`/기본값 폴백):

**봉사**

- `preferredRegion` / `preferredActivityRegion`
- `grade` / `applicationGrade`
- `contact` / `email`
- `hasEducationExperience` / `educationExperience`
- `interviewAvailability[]` `{ startAt, endAt }`
- `managerAEvaluation` / `managerBEvaluation` / scores
- `assignedInterview*` / `interviewAssignmentStatus`
- `finalResultStatus` / `documentStatus`

**기관**

- `regionSido` 또는 education region code/label
- grade·class count 구조
- 담당 교사명
- `status` (위 TEMP_* 포함)

OpenAPI generated 타입이 thin하면 FE는 enrichment cast로 우회 중입니다. **스키마에 properties를 명시**해 주세요.

---

## 6. 시드 요청 (검증용)

Primary UJAT 프로그램 1개에 최소:

| 시드 | 내용 |
|------|------|
| H1 봉사 | 서류대기·합격·면접배정·최종승인 각 ≥1 |
| H2 봉사 | 동일 세트 (H1과 applicationId 불교차) |
| 기관 | PENDING / TEMP_ASSIGNED(+temporary-schedule 데이터) / TEMP_REJECTED / APPROVED 각 ≥1 |
| 교육 진행 | APPROVED 기관·봉사에 schedule + attendance 샘플 ≥1일 |
| 설문 | SURVEY / SATISFACTION(TEACHER·VOLUNTEER_H1) / LECTURE_EVALUATION binding 각 ≥1 |

관련: [be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md](./be-handoff-program-dummy-seeds/03-ujat-program-dummy-seed.md), [ujat-primary-case-fe-adapter-2026-09-15.md](./ujat-primary-case-fe-adapter-2026-09-15.md)

---

## 7. FE 후속 (BE 반영 후)

1. OpenAPI 스냅샷 동기화 → orval codegen  
2. `applications-list-query.ts`에 `recruitHalf` / `recruitmentId` 전달  
3. schedule-assign/confirm: 로컬 draft → temporary-schedule GET/PUT  
4. progress attendance/region/assignments: execution 클라이언트 신규  
5. [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md) 상태표 갱신  

---

## 8. 비범위

- 일반·1사1교·Gemini 프로그램 API 변경
- UJAT 교육 지역 마스터 CRUD (별도 Cat3 handoff)
- FE mock 시드 재도입
