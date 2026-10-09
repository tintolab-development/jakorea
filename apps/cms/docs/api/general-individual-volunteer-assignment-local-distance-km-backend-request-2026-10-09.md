# Cursor prompt — 일반 개인 봉사자 배정 · local에서도 `distanceKm` non-null (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-individual-volunteer-assignment-local-distance-km-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **BE 완료 (옵션 A)** · FE 추가 작업 없음. handoff: `JABACK/docs/frontend/general-individual-volunteer-assignment-local-distance-km-frontend-handoff-2026-10-09.md`. local에서 자택·장소 모두 있으면 enrich `distanceKm` number (1.0–99.9 deterministic mock) → UI `Nkm` |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (로컬 QA / 시안 검수용) |
| 화면 | CMS 일반 프로그램 상세 → 프로그램 진행 현황 → 참여 봉사자 상세 → **봉사 배정 현황** |
| 대상 프로그램 | 일반 **개인** (`GENERAL_INDIVIDUAL`). 기관형·1사1교·Gemini·UJAT 아님 |
| 재현 | `programId=186050`, VOLUNTEER `participantId=1694734`, `scheduleId=186626` |

관련:

- FE enrich 요청(완료): [general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md](./general-individual-volunteer-assignment-region-distance-backend-request-2026-10-09.md)
- FE 장소 시드 요청(완료): [general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md](./general-individual-volunteer-assignment-schedule-location-seed-backend-request-2026-10-09.md)
- BE → FE (거리 `-` 계약, local null 가정 **폐기**): `JABACK/docs/frontend/general-individual-volunteer-assignment-distance-dash-frontend-prompt-2026-10-09.md`
- BE enrich handoff: `JABACK/docs/frontend/general-individual-volunteer-assignment-region-distance-frontend-handoff-2026-10-09.md`
- BE → FE (옵션 A 완료): `JABACK/docs/frontend/general-individual-volunteer-assignment-local-distance-km-frontend-handoff-2026-10-09.md`

---

## 1. 한 줄 요약

「봉사 지역」은 local에서 이미 채워진다.  
「자택과의 거리」만 `-`인 이유는 FE 버그가 아니라 **`LOCAL_DISTANCE`일 때 education-scope enrich가 `distanceKm`를 항상 `null`로 내리는 BE 정책**이다.  
로컬 CMS QA에서 시안처럼 `Nkm`을 보려면 BE가 local에서도 **재현 가능한 non-null `distanceKm`** 를 내려달라.  
**FE는 km를 invent·해시·0 coerce 하지 않는다.**

---

## 2. FE 관측 (코드 + UI, 2026-10-09)

### 2.1 UI

- 「봉사 지역」: `서울특별시 금천구` (non-null) ✅  
- 「자택과의 거리」: `-` ❌ (시안은 `Nkm` / 장거리 표기)

### 2.2 FE 표시 경로 (변경 불필요 · invent 금지)

```ts
// apps/cms/.../participating-individual-volunteer-assignment.ts
const distanceFromHome = formatDistanceKm(enrich?.distanceKm)
// null / undefined / NaN → '-'
```

`ParticipatingIndividualVolunteerAssignmentSection`은  
`scopeQuery.data?.schedules` → `scopeScheduleEnrich`로 join한다.  
enrich·join·포맷은 이미 반영됨.

### 2.3 BE 코드 (현행 — null 원인)

`application-local.yml`:

```yaml
ja.provider.distance.mode: LOCAL_DISTANCE
```

`LocalDistanceProvider`는 stub으로 `0km` + provider `"LOCAL_DISTANCE"`를 반환한다.

`ParticipantEducationScopeService.resolveDistanceKm`는 LOCAL을 **표시용으로 쓰지 않고 null**:

```java
// LOCAL_DISTANCE stub always returns 0 and is not a real route — treat as unavailable.
if ("LOCAL_DISTANCE".equalsIgnoreCase(result.provider())) {
    return null;
}
```

→ GET education-scope `schedules[].distanceKm`가 local에서 항상 `null` → FE `-`.

---

## 3. 요청 API (시그니처 유지)

```http
GET /api/admin/programs/{programId}/participants/{participantId}/education-scope
```

기존 enrich shape 유지 (`CmsParticipantEducationScopeScheduleEnrich`):

| 필드 | 현 local | 요청 후 (local QA) |
|------|----------|-------------------|
| `scheduleId` | number | 동일 |
| `locationName` / `address` | non-null (시드 완료) | 유지 |
| `distanceKm` | **항상 `null`** | **number** (재현 가능) |
| `assignedVolunteerCount` | number | 유지 |

`scheduleIds` / `revision` / PUT body 시그니처는 **바꾸지 마라**.

기대 예시 (`186050` / `1694734` / `186626`):

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
      "locationName": "서울특별시 금천구",
      "address": "<non-null>",
      "distanceKm": 12.3,
      "assignedVolunteerCount": 0
    }
  ]
}
```

FE 표시: `12.3` → `12km` (강사 배정과 동일 `formatDistanceKm`, `>=100`이면 `Nkm (장거리)`).

---

## 4. 권장 구현 옵션 (BE가 하나 선택)

제품 정책은 BE가 결정한다. FE는 **API가 준 number만** 표시한다.

### 옵션 A — local mock km (권장 · QA 친화)

`LOCAL_DISTANCE`여도 education-scope enrich에만 **결정적(deterministic) non-null km**를 내린다.

예:

- 자택·장소 주소가 모두 있으면 stub `0` 대신 고정 mock (예: `12.3`) 또는  
  주소 해시 → `1.0`~`99.9` 범위의 **결정적** 소수 1자리
- 주소 한쪽이 비면 기존과 같이 `null`
- **실측 Naver 호출은 하지 않음** (local 키/네트워크 불필요)
- staging/prod `NAVER_MAPS` 경로는 그대로 실측

### 옵션 B — LOCAL stub `0`을 enrich에 그대로 노출

`resolveDistanceKm`의 LOCAL → null 분기를 제거하고 `0.0`을 내린다.

- FE는 `0km`로 표시 (시안과 다를 수 있음)
- 「거리 컬럼이 채워지는지」만 검증할 때 사용
- QA가 `Nkm`(비영)을 원하면 옵션 A가 낫다

### 옵션 C — 정책 유지 (null 유지)

local에서는 계속 `-`를 허용하고, `Nkm` 검증은 staging/prod(`NAVER_MAPS`)에서만 한다.

이 경우:

- 본 티켓은 **Won’t fix / 문서화**로 닫고
- FE·QA 수용 기준을 「local: 지역 non-null + 거리 `-` PASS」로 명시
- BE handoff에 LOCAL null 정책을 한 줄 유지

**FE 팀은 옵션 A를 요청한다** (로컬만으로 시안 검수 가능).

---

## 5. 하지 말 것

- education-scope / PUT `scheduleIds` 시그니처 변경
- FE가 `homeAddressSummary`·해시·임의 숫자로 km invent하도록 요구
- dashboard `program-schedules`에만 `distanceKm`를 추가하고 education-scope enrich는 null 유지  
  (FE 거리는 **education-scope `schedules[].distanceKm` 전용**)
- 기관형·강사 배정 기본 동작 변경 (개인 VOLUNTEER education-scope enrich 한정)
- production에서 LOCAL stub 숫자를 실측처럼 보이게 하는 설정 실수

---

## 6. 데이터 전제 (이미 충족된 것 · 재확인만)

| 소스 | 용도 | 상태 |
|------|------|------|
| schedule `locationName` / `address` | 봉사 지역 · 거리 도착지 | local 시드 완료(지역 표시 OK) |
| `member_personal_profile.address`(+detail) | 거리 출발지(자택) | 비어 있으면 `distanceKm` null 유지 허용 |
| DistanceProvider mode | local=`LOCAL_DISTANCE` | 현행. 옵션 A/B로 enrich 정책만 조정 |

자택 주소가 비어 null이면 FE `-`가 맞다.  
**자택·장소가 모두 있는데도 LOCAL이라 null인 경우**가 본 티켓 대상이다.

---

## 7. 수용 기준

- [ ] `GET …/programs/186050/participants/1694734/education-scope`의 `schedules[]`에 `scheduleId=186626` 존재
- [ ] 같은 행 `locationName` 또는 `address` non-null (기존 PASS 유지)
- [ ] **옵션 A 선택 시:** 자택·장소 모두 있으면 같은 행 `distanceKm`가 **number** (null 아님). 재호출해도 동일 값(결정적)
- [ ] **옵션 B 선택 시:** `distanceKm === 0` (또는 `0.0`)이 내려오고 FE가 `0km` 표시
- [ ] **옵션 C 선택 시:** handoff에 「local은 `-` PASS / `Nkm`은 NAVER만」명시 후 본 티켓 종료
- [ ] CMS UI 「자택과의 거리」가 옵션 A/B면 `Nkm`(또는 `0km`), C면 `-`
- [ ] PUT education-scope·`scheduleIds` 회귀 없음
- [ ] FE invent 없이 Network 숫자만으로 UI가 채워짐

---

## 8. FE 쪽 (참고 · 이 티켓에서 수정하지 말 것)

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/program/general/api/program-progress-api-client.ts` | `ParticipantEducationScopeScheduleEnrich.distanceKm` |
| `apps/cms/src/features/program/general/ui/detail-modal/program-status/participating-individual-volunteer-assignment-section.tsx` | `scopeScheduleEnrich` 전달 |
| `apps/cms/src/features/program/general/lib/participating-individual-volunteer-assignment.ts` | join + `formatDistanceKm` |

BE가 number를 주면 FE 추가 작업 없이 `Nkm`이 나온다.

---

## 9. QA

- CMS: `admin1@jakorea.org` / `test1234!` / MFA `000000`
- URL:  
  `http://localhost:3000/programs/general?programId=186050&lnb=progress&tab=progress_volunteers&volunteerId=1694734&volunteerTab=assignment`
- Network: `education-scope` → `data.schedules[scheduleId=186626].distanceKm`

### BE 완료 후 FE handoff (짧게)

1. 선택한 옵션(A/B/C)과 local `distanceKm` 예시 JSON
2. 자택 주소 없을 때 null 유지 여부
3. staging/prod(`NAVER_MAPS`)와 local 정책 차이 한 줄
