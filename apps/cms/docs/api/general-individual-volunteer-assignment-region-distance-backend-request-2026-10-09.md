# Cursor prompt — 일반 개인 봉사자 배정 · 봉사 지역·거리·배정 인원 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | BE enrich 반영 · FE 연동 완료. **후속(장소·시드):** [general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md](./general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md) |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** |
| 화면 | CMS 일반 프로그램 상세 → 프로그램 진행 현황 → 참여 봉사자 상세 → **봉사 배정 현황** (`volunteerTab=assignment`) |
| 대상 프로그램 | 일반 **개인**만 (`generalProgramAudience=individual`). 기관형·1사1교·Gemini·UJAT 아님 |

관련(이 티켓에서 시그니처를 바꾸지 마라):

- [general-individual-progress-survey-remote-gaps-backend-request-2026-09-17.md](./general-individual-progress-survey-remote-gaps-backend-request-2026-09-17.md) — 개인 봉사 education-scope
- [general-program-progress-remaining-backend-request-2026-10-02.md](./general-program-progress-remaining-backend-request-2026-10-02.md) — 기관형 assigned-organizations (혼용 금지)

---

## 1. 한 줄 요약

개인형 참여 봉사자 「배정된 봉사 일정 / 배정 대기 봉사 일정」테이블에 **봉사 지역 · 자택과의 거리 · 배정 봉사자 수**를 채울 수 있도록 schedule / education-scope enrich가 필요하다.

CMS FE는 컬럼·엑셀을 시안에 맞춰 이미 추가했다. 값 소스가 없으면 `'-'`를 보여 준다.

---

## 2. 지금 (FE)

화면: `ParticipatingIndividualVolunteerAssignmentSection`

데이터:

```http
GET /api/admin/program-execution/programs/{programId}/participants/{participantId}/education-scope
PUT /api/admin/program-execution/programs/{programId}/participants/{participantId}/education-scope
```

- body/response: `scheduleIds`, `configured`, `revision` / `expectedRevision`, `reason` — **시그니처 유지**

스케줄 목록:

```http
GET /api/admin/dashboard/program-schedules
```

(또는 progress schedules bundle — FE는 `fetchGeneralProgressAttendanceBundle` → `schedules[]`)

현재 OpenAPI `DashboardProgramScheduleResponse`:

| 필드 | FE 사용 |
|------|---------|
| `scheduleId` | 행 키 · education-scope 조인 |
| `sessionNo` / `startAt` / `endAt` / `scheduleName` | 일정 라벨 |
| `locationName` | **봉사 지역** (있으면 시·도+구·군 축약 표시) |
| `address` | locationName 없을 때 fallback |
| `distanceKm` | **없음** → 거리 컬럼 `'-'` |
| 배정 봉사자 수 | **없음** → waiting 행 `'-'` |

---

## 3. 화면이 필요한 것

시안: Figma `4968:111504` (개인 봉사 배정 현황)

### 3.1 배정된 봉사 일정

| UI | 의미 | 권장 소스 |
|----|------|-----------|
| 봉사 지역 | 시·도 + 구·군 (예: `서울특별시 강서구`) | schedule `locationName` 또는 `address` |
| 자택과의 거리 | `Nkm` | 봉사자 자택 ↔ 해당 schedule 장소 `distanceKm` |
| 담당 봉사 진행 일정 | 기존 | `startAt`/`endAt`/`sessionNo` |

행 단위: **scheduleId 1행** (education-scope PUT 단위와 동일).

### 3.2 배정 대기 봉사 일정

| UI | 의미 | 권장 소스 |
|----|------|-----------|
| 봉사 지역 | 동일 | schedule |
| 자택과의 거리 | 동일 | `distanceKm` (해당 봉사자 기준) |
| 봉사 진행 희망 일정 | 기존 | schedule |
| 배정 현황 | 배정 대기 / 배정 불가 | FE 슬롯 점유 로직 유지 가능 |
| 배정 봉사자 수 | `N명` | 동일 `scheduleId`를 education-scope에 넣은 **VOLUNTEER** 참여자 수 |

---

## 4. BE 요청

### 4.1 스케줄 지역 채움 (필수)

개인 프로그램 schedule에도 `locationName` 및/또는 `address`를 채워라.  
빈 문자열·omit이면 FE는 `'-'`.

### 4.2 자택과의 거리 (필수)

봉사자(해당 `participantId`의 회원 자택 주소)와 schedule 장소 사이 거리.

권장(택 1, OpenAPI에 명시):

**A.** schedules 응답에 컨텍스트 의존 필드 추가 (participant 스코프 조인 시):

```json
{
  "scheduleId": 123,
  "locationName": "서울특별시 강서구 …",
  "address": "…",
  "distanceKm": 5.0
}
```

**B.** education-scope GET에 schedule 요약 배열 enrich:

```json
{
  "scheduleIds": [123, 456],
  "schedules": [
    {
      "scheduleId": 123,
      "locationName": "서울특별시 강서구",
      "distanceKm": 5.0,
      "assignedVolunteerCount": 4
    }
  ]
}
```

표시: FE는 `distanceKm` → `{floor/round}km` (강사 배정 `formatDistanceKm`와 동일 관례).  
거리 산출 불가·주소 없으면 `null` → FE `'-'`.

FE가 km를 invent하지 않는다. 해시·임시 계산 금지.

### 4.3 배정 봉사자 수 (필수)

동일 프로그램에서 해당 `scheduleId`를 education-scope `scheduleIds`에 포함한 **VOLUNTEER** participant 수.

- 응답 필드명 권장: `assignedVolunteerCount` (number)
- FE 표시: `${n}명`
- 0이면 `0명` (omit 하지 말 것)

### 4.4 하지 말 것

- education-scope GET/PUT의 `scheduleIds` 계약 변경
- 기관형 `assigned-organizations` / volunteer-assignments path와 혼용
- 개인 봉사 배정을 기관명 컬럼으로 바꾸기 (시안은 **봉사 지역**)

---

## 5. 수용 기준

- [ ] 개인 프로그램 schedules에 `locationName` 또는 `address`가 채워져 FE 「봉사 지역」이 `'-'`가 아닌 경우가 있다
- [ ] 봉사자 상세 assignment 탭에서 schedule별 `distanceKm`(또는 동등)이 내려와 「자택과의 거리」가 `Nkm`으로 표시된다
- [ ] 대기 테이블 「배정 봉사자 수」가 동일 scheduleId VOLUNTEER education-scope 인원과 일치한다
- [ ] education-scope PUT 후 GET이 기존과 같이 `scheduleIds`만으로도 동작한다 (enrich는 additive)

---

## 6. FE 참고 경로

- UI: `apps/cms/src/features/program/general/ui/detail-modal/program-status/participating-individual-volunteer-assignment-section.tsx`
- 행 빌더: `apps/cms/src/features/program/general/lib/participating-individual-volunteer-assignment.ts` (`buildIndividualVolunteerAssignmentRowsFromEducationScope`)
- 스케줄 타입: `DashboardProgramScheduleResponse` (`locationName`, `address`)
