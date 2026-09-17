# BE 수정 요청 — UJAT 교육 진행 P2 (OpenAPI schema + allocation-matrix 반기 필터)

**작성일:** 2026-09-17  
**상태:** ✅ BE 반영 · ✅ FE `semesterType` 연동 (2026-09-17)  
**우선순위:** P2 — OpenAPI schema fill + allocation-matrix 반기 필터  
**대상 화면:** CMS `/programs/ujat?programId=…` → LNB 교육 진행 `edu_h1_region` / `edu_h2_region` · `edu_h1_attendance` / `edu_h2_attendance`  
**범위:** UJAT `program-execution` only (일반·1사1교·Gemini 간섭 금지)  
**선행:** P0 half/`temporary-schedule` · FE P1 remote (`education-execution-api.ts`)  
**BE handoff:** `JABACK/docs/frontend/ujat-education-progress-p2-openapi-half-frontend-handoff-2026-09-17.md`  
**관련 문서:**
- [ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md](./ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md) (P0/P1 이력)
- [programs-ujat-detail-api-conversion-status.md](./programs-ujat-detail-api-conversion-status.md)
- BE 런타임: `UjatRegionalAssignmentAdminController`, `UjatAllocationMatrixDtos`, `ProgramExecutionAdminController`

### FE 반영 (2026-09-17)

| 항목 | 상태 |
|------|------|
| OpenAPI `backend.openapi.json` sync | ✅ |
| `fetchUjatAllocationMatrix({ semesterType })` | ✅ |
| region/attendance queryKey에 half | ✅ |
| auto-assign body `semesterType` | ✅ |
| dashboard orval codegen | ⏭️ subset 미포함 · 수동 타입 유지 |

---

## 백엔드 전달용 프롬프트 (복사용)

아래를 BE 이슈/PR 본문에 그대로 붙여 주세요.

````markdown
## 요청 요약

CMS UJAT 교육 진행(지역 배정 · 출석) FE는 **이미 런타임 API에 붙어 있습니다.**  
남은 것은 (1) **OpenAPI에 request/response schema를 채우는 것**, (2) **allocation-matrix에 상·하반기 필터를 추가하는 것**입니다.

런타임 DTO는 Java에 이미 있습니다. OpenAPI를 **기존 Java record와 동일하게** `$ref`로 연결해 주시면 FE가 수동 타입 → codegen으로 전환합니다.  
추가로 `GET …/allocation-matrix`에 `semesterType`(또는 `recruitHalf`) 필터가 없어 CMS 상·하반기 탭이 **동일 region matrix**를 보여 줍니다.

FE mock 시드 없음 · gate: JWT + `programs,ujatPrograms,applications`.

---

## A. OpenAPI schema fill (런타임 변경 최소화)

`backend.openapi.json`에서 아래 path는 현재 **summary + `200 OK`만** 있고 parameters / requestBody / response `$ref`가 없습니다.  
Java 컨트롤러·DTO는 이미 구현되어 있으므로 **스펙만 채우면 됩니다** (동작 변경 없이).

### A-1. 지역 배정 (`UjatRegionalAssignmentAdminController`)

Base: `/api/admin/program-execution/programs/{programId}/ujat`

| Method | Path | Request | Response (Java) |
|--------|------|---------|-----------------|
| GET | `/allocation-matrix` | query: `educationRegionCode?`, `scheduleIds?`, **(+ B의 반기)** | `UjatAllocationMatrixDtos.AllocationMatrixResponse` |
| POST | `/partner-assignments:auto` | `AutoAssignmentRequest` `{ educationRegionCode? }` | `AutoAssignmentResponse` |
| GET | `/education-slots/{educationSlotId}/direct-assignment-candidates` | path | `DirectAssignmentCandidatesResponse` |
| POST | `/education-slots/{educationSlotId}/direct-assignment` | `DirectAssignmentRequest` `{ participantId }` | `DirectAssignmentResponse` |
| GET | `/schedules/{scheduleId}/unavailability` | path | `List<VolunteerUnavailabilityResponse>` |
| POST | `/schedules/{scheduleId}/unavailability` | `VolunteerUnavailabilityRequest` | `VolunteerUnavailabilityResponse` |
| DELETE | `/schedules/{scheduleId}/unavailability/{participantId}` | path | `204` 또는 void |
| PUT | `/schedules/{scheduleId}/attendance-manager` | `AttendanceManagerUpdateRequest` `{ participantId }` | `204` 또는 void |

참고: `region-capacities` / `planning-estimates`는 이미 OpenAPI rich — **유지**.

### A-2. 파트너 배정 · 출석 (`ProgramExecutionAdminController`)

| Method | Path | Request | Response (Java) |
|--------|------|---------|-----------------|
| GET | `/programs/{programId}/schedules/{scheduleId}/ujat/partner-assignments` | query `organizationApplicationId?` | `List<UjatDgbongPartnerAssignmentResponse>` |
| POST | 동일 | `UjatDgbongPartnerAssignmentConfirmRequest` | `UjatDgbongPartnerAssignmentResponse` |
| POST | `…/partner-assignments/{assignmentGroupId}/cancel` | `AssignmentCancelRequest` | `UjatDgbongPartnerAssignmentResponse` |
| GET | `…/ujat/partner-recommendation` | query `organizationApplicationId?` | `UjatDgbongPartnerPairRecommendationResponse` |
| GET | `/programs/{programId}/schedules/{scheduleId}/attendances` | path | `List<AttendanceItemResponse>` |
| POST | `/programs/{programId}/attendances:bulk-upsert` | `AttendanceBulkUpsertRequest` | `AttendanceBulkUpsertResponse` |

### A-3. 권장 OpenAPI component 이름 (codegen 안정)

이미 subset OpenAPI/orphan에 비슷한 이름이 있으면 **동일 이름·필드**로 승격해 path에 `$ref` 연결:

- `AllocationMatrixResponse` / `AllocationColumn` / `VolunteerRow` / `AllocationCell`
- `DirectAssignmentRequest` / `DirectAssignmentResponse` / `DirectAssignmentCandidatesResponse` / `DirectAssignmentCandidate`
- `UjatDgbongPartnerAssignmentResponse` / `UjatDgbongPartnerAssignmentConfirmRequest`
- `AttendanceItemResponse` / `AttendanceItemRequest` / `AttendanceBulkUpsertRequest` / `AttendanceBulkUpsertResponse`
- Auto/Unavailability/AttendanceManager: Java `UjatAutoAssignmentDtos` records를 components로 추가

### A-4. AllocationMatrix 필드 (런타임 SSOT — FE가 이미 읽는 값)

```json
{
  "programId": 182103,
  "educationRegionCode": "SEOUL",
  "columns": [
    {
      "columnKey": "182321:10001",
      "scheduleId": 182321,
      "educationStartAt": "2026-04-01T10:00:00+09:00",
      "organizationApplicationId": 10001,
      "organizationName": "○○초",
      "organizationRegion": "강남구",
      "educationRegionCode": "SEOUL",
      "classCount": 2
    }
  ],
  "volunteers": [
    {
      "participantId": 21001,
      "memberId": 30001,
      "volunteerName": "김봉사",
      "educationRegionCode": "SEOUL",
      "participantStatus": "APPROVED",
      "giveUp": false,
      "totalAssignedDays": 3,
      "cells": [
        {
          "columnKey": "182321:10001",
          "scheduleId": 182321,
          "organizationApplicationId": 10001,
          "educationSlotId": 31001,
          "assignmentGroupId": "…uuid…",
          "classLabel": "3-1",
          "attendanceManager": true,
          "singleAssignment": false,
          "unavailable": false,
          "needsReassignment": false,
          "assignmentStatus": "ASSIGNED"
        }
      ]
    }
  ]
}
```

**필수:** path parameter `programId`(및 scheduleId / educationSlotId / assignmentGroupId / participantId)를 OpenAPI `parameters`에 명시. 현재 stub에는 path param 정의도 빠져 있습니다.

---

## B. allocation-matrix 상·하반기 필터 (런타임 필요)

### 현상

- CMS UI: `edu_h1_region` / `edu_h2_region`, `edu_h1_attendance` / `edu_h2_attendance`
- FE는 `educationRegionCode`만 넘겨 matrix를 조회함
- API query: `educationRegionCode`, `scheduleIds` 만 존재 → **반기 구분 불가**
- 결과: 상·하반기 탭이 **같은 region의 전체 schedule 컬럼**을 표시

### 요청 계약 (권장)

```http
GET /api/admin/program-execution/programs/{programId}/ujat/allocation-matrix
  ?educationRegionCode=SEOUL
  &semesterType=FIRST_HALF
```

| query | enum / 형식 | 비고 |
|-------|-------------|------|
| `semesterType` | `FIRST_HALF` \| `SECOND_HALF` | **권장** — `region-capacities` / `planning-estimates`와 동일 키 |
| 또는 `recruitHalf` | `FIRST_HALF` \| `SECOND_HALF` | P0 신청 목록과 동일 alias 허용 시 OK (`H1`/`H2` 등) |

- 미지정: 현행과 동일(전체) 또는 문서화된 기본값
- 응답 echo 권장: top-level `semesterType` (또는 `recruitHalf`)
- 필터 의미: matrix **columns**(및 해당 cell)가 해당 반기 `program_schedule` / 확정 슬롯만 포함  
  - 봉사 row는 지역 기준 유지하되, **다른 반기 전용 배정 cell은 비우거나 제외**
- half 판정 규칙은 P0 `recruitHalf`와 **동일 소스**를 권장  
  (예: volunteer recruitment 슬롯 1·2 순위 ↔ schedule/semester 매핑 — 서버에서 문서화)

### 함께 맞추면 좋은 API (선택 · 동일 반기 키)

| API | 이유 |
|-----|------|
| `POST …/partner-assignments:auto` | body에 `semesterType` 추가 → 해당 반기 슬롯만 자동 배정 |
| 출석 세션 목록 | FE는 matrix columns로 schedule를 고름 → matrix half 필터만으로도 출석 반기 분리 가능 |

### 시드 / 검증

동일 primary case 프로그램에서:

```http
GET …/allocation-matrix?educationRegionCode=SEOUL&semesterType=FIRST_HALF
GET …/allocation-matrix?educationRegionCode=SEOUL&semesterType=SECOND_HALF
```

→ `columns[].scheduleId` 집합이 **서로 겹치지 않거나**, 문서화된 예외만 허용.  
→ CMS `edu_h1_*` / `edu_h2_*`에서 다른 교육일 열이 보여야 함.

---

## C. 수락 기준

- [ ] A 목록 path 전부에 `parameters` + `requestBody`(해당 시) + `200` schema `$ref`가 있음 (summary-only stub 제거)
- [ ] OpenAPI components 필드가 Java record와 일치 (특히 AllocationCell · AttendanceItem*)
- [ ] `GET allocation-matrix?semesterType=FIRST_HALF|SECOND_HALF`가 서로 다른 column 집합을 반환 (시드 검증)
- [ ] 응답에 `semesterType`(또는 `recruitHalf`) echo
- [ ] 기존 FE 호출(`educationRegionCode` only)은 깨지지 않음 (반기 미지정 = 현행 호환)
- [ ] CMS가 `openapi/backend.openapi.json` 동기화 후 orval/codegen 가능 (또는 최소 수동 스키마 교체 가능)

## D. 범위 밖

- 과제(homework) 탭 API 신설
- 교육 진행 요약(KPI) API
- temporary-schedule isoDate 계약 변경
- 일반 / 1사1교 / Gemini

## E. FE 참고 경로

- 수동 클라이언트: `apps/cms/src/features/program/ujat/api/education-execution-api.ts`
- 어댑터: `…/api/allocation-matrix-adapters.ts`
- 지역 탭: `…/progress/region/use-region-assignment.ts`
- 출석 탭: `…/progress/attendance/use-list.ts`
- BE Java: `com.jakorea.cms.ujat.controller.UjatRegionalAssignmentAdminController`
- BE Java: `com.jakorea.cms.ujat.dto.UjatAllocationMatrixDtos`
````

---

## 1. FE 현황 (왜 P2인가)

| 항목 | 상태 |
|------|------|
| 지역 탭 remote | ✅ `GET allocation-matrix` + auto/direct/unavailability/attendance-manager |
| 출석 탭 remote | ✅ matrix columns + attendances GET/bulk-upsert |
| OpenAPI | ❌ thin stub → FE **수동 타입** (`education-execution-api.ts`) |
| 상·하반기 matrix 분리 | ❌ query에 half 없음 → h1/h2 동일 데이터 |
| 과제 탭 | ❌ API 없음 (별도 백로그) |

반기 필터가 오면 FE는 `toUjatRecruitHalfApi(half)` → `semesterType`/`recruitHalf`로 전달하고, queryKey에 half를 넣어 캐시를 분리합니다.

---

## 2. 반기 키 정합 (FE 기대)

| UI | FE half | API (권장) |
|----|---------|------------|
| `edu_h1_*` | `h1` | `semesterType=FIRST_HALF` |
| `edu_h2_*` | `h2` | `semesterType=SECOND_HALF` |

이미 서버에 있는 동일 개념:

- `region-capacities` / `planning-estimates`의 `semesterType`
- 신청 목록 P0의 `recruitHalf=FIRST_HALF|SECOND_HALF`

**한 축으로 통일**해 주시면 FE 매핑이 단순합니다. (`semesterType` 권장, `recruitHalf` alias 허용도 OK)

---

## 3. OpenAPI 갭 체크리스트 (동기화 대상)

`apps/cms/openapi/backend.openapi.json` 기준 thin stub:

- [ ] `…/ujat/allocation-matrix`
- [ ] `…/ujat/partner-assignments:auto`
- [ ] `…/ujat/education-slots/{id}/direct-assignment(-candidates)`
- [ ] `…/ujat/schedules/{id}/unavailability` (+ DELETE participant)
- [ ] `…/ujat/schedules/{id}/attendance-manager`
- [ ] `…/schedules/{id}/ujat/partner-assignments` (+ cancel · recommendation)
- [ ] `…/schedules/{id}/attendances`
- [ ] `…/attendances:bulk-upsert`

이미 rich (건드리지 말 것 / 회귀만 주의):

- [x] `…/ujat/region-capacities`
- [x] `…/ujat/planning-estimates`

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-17 | 초안 — P2 OpenAPI fill + allocation-matrix `semesterType`/`recruitHalf` |
