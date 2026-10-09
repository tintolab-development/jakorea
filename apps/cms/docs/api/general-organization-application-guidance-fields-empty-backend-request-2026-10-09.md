# Cursor prompt — 일반 기관 신청 「안내 사항」CMS 미반영 검토 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-organization-application-guidance-fields-empty-backend-request-2026-10-09.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-09 |
| 상태 | **BE 수정 완료 · FE 추가 작업 없음** (핸드오프 수신 2026-10-09) |
| BE 핸드오프 | `JABACK/docs/frontend/general-organization-application-guidance-fields-frontend-handoff-2026-10-09.md` |
| 원인 | **`FORM_ONLY_NOT_PROJECTED`** — form에 guidance 저장됐으나 snapshot 컬럼 프로젝션 누락 |
| BE 수정 | Portal draft/submit → guidance snapshot 프로젝션 + V25 backfill |
| FE | 키 변경 없음. detail 재조회로 4칸 채워짐. form fallback·성범죄 form hydrate 유지 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (신청자가 작성했다고 하는데 CMS 상세 「안내 사항」이 전부 `-`) |
| 화면 | CMS 일반 프로그램 → LNB **기관 신청 목록** → 기관 신청 상세 → **신청 정보** 탭 → 「안내 사항」 |
| 재현 예시 | programId `186068` (`GENERAL_ORGANIZATION`), organizationApplicationId **`1691189`** (강서초등학교, 승인 완료) |
| 대상 path | `GET /api/admin/organization-applications/{id}` · form_response by context · (선택) Portal 제출 시 저장 path |

관련 FE:

- 상세 표시: `apps/cms/src/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.tsx`
- DTO 매핑: `readOrganizationApplicationDetailExtendFields` (`general-applications-adapters.ts`)
- form fallback hydrate: `hydrateOrganizationApplicationRowFromForm` / `parseGuidanceRows` (`organization-application-form-adapters.ts`)
- schema 필드 id: `@jakorea/form-schema` `INSTITUTION_GUIDANCE_FIELDS` (`computer-in-room`, `waiting-place`, `meal`, `other-notes`)
- 단락 id: `program-application-institution-seed-guidance` (economy: `program-application-economy-seed-guidance`)

---

## 1. 한 줄 요약

Portal에서 기관 신청 시 **안내 사항**을 작성했다고 하는데, CMS 기관 신청 상세 「안내 사항」5칸이 모두 `-`다.  
희망 교육 일정은 정상 표시되므로 **신청·승인 자체는 동작**한다.  
FE는 (1) detail DTO 컬럼 (2) 없으면 form_response 안내 단락을 읽어 채운다.  
둘 다 비면 `-`다. **제출 값이 detail 컬럼·form_response에 남는지 BE에서 추적·수정하라.**

---

## 2. FE 관측 (2026-10-09)

### 2.1 UI

기관 `1691189` 상세 「안내 사항」:

| 라벨 | 표시 |
|------|------|
| 강의 공간 내 컴퓨터 여부 | `-` |
| 대기 장소 안내 | `-` |
| 식사 가능 여부 및 안내 | `-` |
| 기타 특이사항(주차, 전달사항 등) | `-` |
| 성범죄 경력 조회서 요청 | `-` |

같은 화면 **진행 희망 교육 일정**은 채워져 있음 (예: 2026-10-23, 2026-10-30).  
→ 「신청서 전체가 비었다」가 아니라 **안내 단락/컬럼만 비어 보이는** 상태.

### 2.2 FE가 읽는 계약

#### A. detail GET (우선)

```http
GET /api/admin/organization-applications/1691189
```

FE 매핑 (`OrganizationApplicationDetailResponse` → UI):

| UI | DTO 필드 |
|----|----------|
| 강의 공간 내 컴퓨터 여부 | `computerInRoom` → `computerInSpace` |
| 대기 장소 안내 | `waitingRoomLocation` → `waitingPlaceGuide` / `waitingRoom` |
| 식사 가능 여부 및 안내 | `mealNotice` (또는 `mealProvided`) → `mealInfo` |
| 기타 특이사항 | `parkingInfo` → `otherSpecialNotes` / `parkingInfo` |
| 성범죄 경력 조회서 요청 | **detail DTO에 전용 컬럼 없음** — form_response만 |

`computerInRoom` / `waitingRoomLocation` / `mealNotice` / `parkingInfo` 가 null·빈 문자열이면 UI는 `-`.

#### B. form_response (DTO 비어 있을 때 fallback)

```http
GET … (programId + contextType=ORGANIZATION_APPLICATION + contextId=1691189)
```

FE `fetchLatestFormResponseByContextRemote` → `parseGuidanceRows`:

- flat keys: `computerAvailability` / `computer-in-room` / `computerInRoom`, `waitingAreaGuide` / `waiting-place`, `mealGuide` / `meal`, `otherNotes` / `other-notes`
- 또는 nested JSON under  
  `program-application-institution-seed-guidance` / `program-application-economy-seed-guidance`  
  객체 키: `computer-in-room`, `waiting-place`, `meal`, `other-notes`

성범죄 요청 문구는 sex-offense consent 단락 answers에서 조합한다.

### 2.3 FE 호출 경로 (변경 불필요 — 우선 BE 데이터 확인)

| 역할 | 경로 |
|------|------|
| enrich | `useOrganizationApplicationDetailEnrichment` |
| detail | `fetchOrganizationApplicationDetailRemote` |
| form | `fetchLatestFormResponseByContextRemote` |
| hydrate | `hydrateOrganizationApplicationRowFromForm` |

---

## 3. BE에 확인할 것 (우선순위 순)

### 3.1 재현 건 `1691189` 데이터 SSOT

1. `GET /api/admin/organization-applications/1691189` 응답에서  
   `computerInRoom`, `waitingRoomAvailable`, `waitingRoomLocation`, `mealProvided`, `mealNotice`, `parkingInfo`  
   실제 값(null / `""` / 내용)을 보고하라.
2. 동일 신청의 **최신 form_response** answers에서  
   guidance 단락(`…-seed-guidance`) 또는 flat guidance keys가 **존재하는지**,  
   `answerValueJson` / `answerDisplayText` 원문을 보고하라.
3. Portal 제출 당시 모집의 **「사전 안내 사항 작성 여부」** (`preEducationNoticeRequired` / `preguidanceRequired`)가  
   이 프로그램 `186068`에서 **need**였는지 **none**이었는지 확인하라.  
   none이면 신청 양식에 안내 단락이 없어 **작성 자체가 불가능**했을 수 있다 — 그 경우 CMS `-`는 정상이다.

### 3.2 제출 → 저장 경로

Portal 기관 신청 제출 시 안내 답이:

1. **organization_application 테이블 컬럼**으로 projection 되는가?  
2. **form_response answers**에만 남는가?  
3. 둘 다 안 되는가? (유실)

기대: 최소한 form_response에 schema 필드 id로 남아 CMS hydrate가 채울 수 있어야 한다.  
가능하면 detail GET 컬럼에도 projection 해서 목록/상세/정보수정이 같은 SSOT를 쓰게 하라.

### 3.3 승인 시 덮어쓰기

`POST …/organization-applications/{id}/approve` 이후 안내 컬럼·form이 **지워지거나 null로 바뀌는지** 확인하라.  
재현 건은 이미 승인 완료(`2026.10.09 17:34:30`). 승인 전후 스냅샷이 있으면 비교하라.

### 3.4 성범죄 경력 조회서 요청

detail schema에 전용 필드가 없다. form sex-offense 단락만 있다.  
제출값이 form에 있는데 CMS만 `-`면 form context 조회/키 문제.  
form에도 없으면 Portal 미작성 또는 단락 미포함.

---

## 4. 수용 기준

- [ ] `1691189`에 대해 BE가 **「제출됨 / 미제출 / 모집에서 단락 제외」** 중 하나로 원인을 확정하고 FE 핸드오프에 적는다.
- [ ] 제출됐는데 detail·form 둘 다 비면 **저장 버그 수정** 후:
  - detail GET에 안내 필드가 채워지거나
  - form_response에 hydrate 가능 키로 answers가 남는다.
- [ ] 수정 후 CMS 상세 「안내 사항」에 Portal 작성 내용이 보인다 (빈 값만 `-`).
- [ ] 희망 일정 표시·승인 플로우는 회귀 없음.
- [ ] (권장) OpenAPI `OrganizationApplicationDetailResponse` description에 안내 필드 SSOT(컬럼 vs form)를 명시.

---

## 5. BE → FE 핸드오프 (출력 형식)

작업 후 `JABACK/docs/frontend/` 에 핸드오프를 남겨라. 포함:

1. 원인 분류: `NOT_SUBMITTED` | `PREGUIDANCE_DISABLED` | `FORM_ONLY_NOT_PROJECTED` | `LOST_ON_APPROVE` | `OTHER`
2. `1691189` detail GET 해당 필드 샘플 (마스킹 OK)
3. form_response guidance answer 샘플 (있으면)
4. 수정한 path / 테이블 / projection 여부
5. FE 추가 작업 필요 여부 (키 변경 시 알려라 — 현재 FE는 위 flat·nested 키를 읽음)

---

## 6. 하지 말 것

- FE mock으로 안내 문구를 하드코딩해 채우지 마라.
- 희망 일정 API와 안내 필드 저장을 한 버킷으로 섞지 마라.
- UJAT 안내/임시배정 플로우와 GENERAL 기관 신청을 혼동하지 마라.

---

## 7. 참고 — FE가 기대하는 guidance answer 형태

Portal schema 필드 id (`@jakorea/form-schema`):

```text
computer-in-room
waiting-place
meal
other-notes
```

단락 questionKey 예:

```text
program-application-institution-seed-guidance
```

nested `answerValueJson` 예:

```json
{
  "computer-in-room": "PC 2대, USB 가능",
  "waiting-place": "본관 2층 연구실",
  "meal": "급식실 이용 가능",
  "other-notes": "정문 주차"
}
```

flat questionKey로 각각 저장해도 FE `parseGuidanceRows`가 읽는다.
