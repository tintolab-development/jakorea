# Cursor prompt — 일반 개인 봉사자 배정 · schedule 장소·거리 데이터 채움 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | BE 시드·enrich 완료 · FE join 완료. local 거리: **옵션 A 완료** — [local-distance-km-backend-request](./general-individual-volunteer-assignment-local-distance-km-backend-request-2026-10-09.md) / BE handoff `…-local-distance-km-frontend-handoff-2026-10-09.md`. 자택·장소 있으면 `distanceKm` number → UI `Nkm` |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P0** |
| 화면 | CMS 일반 프로그램 상세 → 프로그램 진행 현황 → 참여 봉사자 상세 → **봉사 배정 현황** |
| 대상 프로그램 | 일반 **개인** (`GENERAL_INDIVIDUAL`). 기관형·1사1교·Gemini·UJAT 아님 |
| 재현 프로그램 | `programId=186050`, `participantId=1694734` (VOLUNTEER), `scheduleId=186626` |

관련:

- BE FE handoff (enrich): `JABACK/docs/frontend/general-individual-volunteer-assignment-region-distance-frontend-handoff-2026-10-09.md`
- BE FE handoff (장소 시드): `JABACK/docs/frontend/general-individual-volunteer-assignment-schedule-location-seed-frontend-handoff-2026-10-09.md`
- BE → FE 프롬프트 (거리 `-` 계약): `JABACK/docs/frontend/general-individual-volunteer-assignment-distance-dash-frontend-prompt-2026-10-09.md`
- FE 이전 enrich 요청: [general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md](./general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md)

---

## 1. 한 줄 요약

`education-scope.schedules[]` enrich **shape는 내려온다.**  
그러나 개인 프로그램 schedule 마스터에 **장소(`locationName`/`address`)가 비어** enrich가 전부 `null`이라 CMS 「봉사 지역」「자택과의 거리」가 `-`다.  
schedule 장소 persist·시드·거리 산출 입력을 채워라.

---

## 2. FE 관측 (2026-10-09 로컬)

### 2.1 education-scope GET — 호출됨 · enrich null

```http
GET /api/admin/programs/186050/participants/1694734/education-scope
```

실제 응답:

```json
{
  "programId": 186050,
  "participantId": 1694734,
  "revision": 2,
  "configured": true,
  "scheduleIds": [],
  "schedules": [
    {
      "scheduleId": 186626,
      "locationName": null,
      "address": null,
      "distanceKm": null,
      "assignedVolunteerCount": 0
    }
  ]
}
```

| 필드 | 관측 | FE |
|------|------|-----|
| `schedules[]` | 존재 (enrich 계약 OK) | join 사용 |
| `locationName` / `address` | **null** | 「봉사 지역」→ `-` |
| `distanceKm` | **null** | 「자택과의 거리」→ `-` |
| `assignedVolunteerCount` | `0` | 「0명」 |
| `scheduleIds` | `[]` | **배정됨 0 / 대기 1**이 정상 (배정 PUT 전) |

### 2.2 dashboard program-schedules — 호출됨 · 장소 필드 없음

```http
GET /api/admin/dashboard/program-schedules?programIds=186050&dateFrom=…&dateTo=…
```

`items[0]` (`scheduleId=186626`)에 `scheduleName` / `startAt` / `endAt` / `sessionNo`는 있다.  
**`locationName` / `address` 키가 없거나 비어 있다.**  
→ schedule 마스터에 장소가 저장되지 않은 것과 일치.

### 2.3 participants VOLUNTEER 목록 — 자택 요약만 있음

```http
GET /api/admin/programs/186050/participants?participantType=VOLUNTEER
```

- `homeAddressSummary`: `"전남광주통합특별시 광산구"` (자택 쪽은 있음)
- `sessions[0]`: `scheduleId=186626` + 일시만. **장소 필드 없음**
- `assignedOrganizationNames`: `[]` (개인형 배정과 무관)

FE는 배정 테이블 지역을 `homeAddressSummary` / `organizationName`으로 invent하지 않는다.  
시안 「봉사 지역」= **일정 장소**다.

### 2.4 attendances — 무관

출석 API는 `status` / `volunteer1365Minutes`만. 지역·거리 소스 아님.

---

## 3. FE 계약 (이미 반영 · 변경하지 마라)

화면: `ParticipatingIndividualVolunteerAssignmentSection`

| UI | 소스 |
|----|------|
| 봉사 지역 | schedule bundle `locationName`/`address` **또는** enrich 동일 필드 → 시·도+구·군 축약. 없으면 `-` |
| 자택과의 거리 | enrich `distanceKm` → `Nkm` (강사와 동일 포맷). null → `-` |
| 배정 봉사자 수 | enrich `assignedVolunteerCount` → `N명` (`0명` 포함) |
| 배정됨 / 대기 | `scheduleIds` 포함 여부 |

FE는 km·지역을 invent / 해시하지 않는다.

---

## 4. BE 요청

### 4.1 schedule 마스터에 장소 persist (필수 · P0)

개인 프로그램(`GENERAL_INDIVIDUAL`) `program_schedule`(또는 동등)에:

| 컬럼/필드 | 예 (186626) |
|-----------|-------------|
| `location_name` / `locationName` | `서울특별시 강서구` 또는 장소명 |
| `address` | 도로명 등 지오코딩 가능한 주소 |
| `address_detail` | optional |

다음 API에서 **동일 값**이 보여야 한다.

1. `GET /api/admin/dashboard/program-schedules?programIds={programId}`  
   → item에 `locationName` / `address` (omit 금지 권장, 없으면 null)
2. `GET …/participants/{participantId}/education-scope`  
   → `schedules[].locationName` / `address`가 마스터를 반영 (지금처럼 null만 올리면 FE `-`)

프로그램 등록·커리큘럼·일정 생성 경로에서 장소를 안 넣으면, **시드/마이그레이션으로라도** QA용 schedule에 주소를 채워라.

### 4.2 시드 / QA 데이터 (필수)

최소한 아래 1건을 채워 재현 가능하게 하라.

| id | 채울 값 |
|----|---------|
| `programId` 186050 · `scheduleId` 186626 | `locationName` + `address` non-null |
| VOLUNTEER `participantId` 1694734 · `memberId` 190081 | `member_personal_profile.address` non-null (목록 `homeAddressSummary`와 정합) |

시드 후 기대 education-scope 예시:

```json
{
  "programId": 186050,
  "participantId": 1694734,
  "configured": true,
  "scheduleIds": [],
  "schedules": [
    {
      "scheduleId": 186626,
      "locationName": "서울특별시 강서구",
      "address": "서울특별시 강서구 공항대로 1",
      "distanceKm": 12.3,
      "assignedVolunteerCount": 0
    }
  ]
}
```

- `LOCAL_DISTANCE` stub이면 `distanceKm`는 null 허용. **그 경우에도 `locationName`/`address`는 non-null**이어야 FE 「봉사 지역」수용 기준을 통과한다.
- Naver(또는 non-LOCAL) provider에서는 `distanceKm` number (소수 1자리 권장).

### 4.3 거리 산출 입력 (필수 · provider non-LOCAL일 때)

핸드오프와 동일:

- 홈: `member_personal_profile.address` (+ detail)
- 장소: schedule `address`(+detail), 없으면 `locationName`
- 주소 없음 / provider 실패 / `LOCAL_DISTANCE` → `distanceKm: null` (FE `-`)

자택만 있고 장소가 null이면 거리는 영원히 null이다. **4.1이 선행**이다.

### 4.4 배정 인원 (`assignedVolunteerCount`) — 검증만

이미 enrich에 있다.  
같은 `scheduleId`를 여러 VOLUNTEER education-scope `scheduleIds`에 PUT한 뒤 count가 일치하는지 시드로 검증하라.  
스키마 변경 금지.

### 4.5 하지 말 것

- education-scope GET/PUT `scheduleIds` / `expectedRevision` / `reason` 시그니처 변경
- enrich shape 제거·rename
- 기관형 `assigned-organizations`와 path 혼용
- FE가 `homeAddressSummary`·`organizationName`을 「봉사 지역」으로 쓰도록 요구하지 마라 (시안·계약 위반)
- attendances로 지역·거리를 대체하지 마라

---

## 5. 수용 기준

- [ ] `GET …/dashboard/program-schedules?programIds=186050` 의 `186626`에 `locationName` 또는 `address` non-null
- [ ] `GET …/participants/1694734/education-scope` 의 `schedules[scheduleId=186626].locationName` 또는 `address` non-null
- [ ] CMS 봉사 배정 현황 「봉사 지역」이 `-`가 아니다 (시·도+구·군 형태)
- [ ] `LOCAL_DISTANCE`가 아니면 「자택과의 거리」가 `Nkm` (null이면 문서에 LOCAL stub임을 명시)
- [ ] `scheduleIds: []`일 때 FE 대기 1건 · 배정 0건. PUT `[186626]` 후 배정 1건 · 대기 0건
- [ ] 동일 schedule에 VOLUNTEER 2명 배정 시 `assignedVolunteerCount` = 2

---

## 6. FE 참고 경로

- UI: `apps/cms/src/features/program/general/ui/detail-modal/program-status/participating-individual-volunteer-assignment-section.tsx`
- 빌더: `apps/cms/src/features/program/general/lib/participating-individual-volunteer-assignment.ts` (`buildIndividualVolunteerAssignmentRowsFromEducationScope`)
- 타입: `ParticipantEducationScopeScheduleEnrich` — `apps/cms/src/features/program/general/api/program-progress-api-client.ts`

---

## 7. 체크리스트 (BE)

- [ ] schedule 186626 장소 persist
- [ ] dashboard program-schedules 응답에 장소 필드 노출
- [ ] education-scope enrich가 마스터 장소 반영
- [ ] QA 시드(프로그램·일정·봉사자 자택) 문서화
- [ ] DistanceProvider 모드(`LOCAL` vs Naver)와 `distanceKm` null 정책 README/핸드오프에 한 줄
- [ ] FE invent 요구 없음 확인
