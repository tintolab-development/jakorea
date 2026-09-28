# BE 전달 프롬프트 — 교육받은 교사 공통 정보 `serviceDetailJson`/`configJson` 이중 카피 + 목록 미러 누락

**작성일:** 2026-09-21  
**후속 (상세 라운드트립 계약 갱신):** [trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md](./trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md) — 필드별 구값 잔존·FE write 이원화. **구현은 후속 문서를 우선**  
**우선순위:** P0 (JSON 이중 카피 · PATCH 후 구값 잔존) · P1 (목록 프로젝션 · 교육 연수 일정명 clear)  
**대상 화면:** CMS `/programs/trained-teachers?programId=186034` LNB **공통 정보**  
**범위:** `programType=TRAINED_TEACHER` 의  
- `PUT|PATCH /api/admin/programs/{id}` `serviceDetailJson`  
- `GET /api/admin/programs/{id}`  
- `GET /api/admin/programs?programType=TRAINED_TEACHER`  
- `GET|PATCH /api/admin/programs/{id}/trained-teacher/detail` `configJson`  
**비범위:** 일반(`GENERAL`) · 1사1교 · UJAT · Gemini 기본 동작 변경 금지  
**관련 문서:**
- [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md)
- [trained-teacher-kpi-venue-mirror-openapi-backend-request-2026-09-17.md](./trained-teacher-kpi-venue-mirror-openapi-backend-request-2026-09-17.md)
- [programs-trained-teachers-api-backend-handoff.md](./programs-trained-teachers-api-backend-handoff.md)
- OpenAPI v9 `ProgramUpdateRequest` / `ProgramResponse` / `TrainedTeacherProgramDetailRequest`

---

## 한줄 요약

교육받은 교사 **공통 정보 저장은 상세 GET top-level에는 반영**됩니다.  
문제는 BE가 `serviceDetailJson`·`configJson`에 **루트 `generalCommonInfo`(구값)** 와 **`program.generalCommonInfo`(신값)** 을 동시에 남겨, 다음 저장·재조회에서 후원사/교재명이 원복될 수 있다는 점입니다.  
PATCH 시 JSON을 **merge하지 말고 요청 body로 교체**해 주세요.  
목록 GET은 같은 필드가 `null`이라 저장 실패처럼 보입니다. 상세와 동일 컬럼을 echo 해 주세요.

---

## 재현 (2026-09-21 로컬, programId `186034`)

1. CMS `/programs/trained-teachers` → 신규 등록 후 상세 공통 정보 수정·저장  
2. 후원사를 `1627251` → `163302`(스타벅스) / 담당자 `163323`(문디지털)  
3. 세부 프로그램명 `사회공헌 프로젝트`, 장소 `교육받은교사(수정)` 등 저장  
4. Network:

```http
GET /api/admin/programs/186034
GET /api/admin/programs/186034/sponsors
GET /api/admin/programs/186034/trained-teacher/detail
GET /api/admin/programs?programType=TRAINED_TEACHER&page=0&size=20
```

### 상세 GET top-level — 반영됨 (OK)

| 필드 | 값 |
|---|---|
| `title` / `mainTitle` / `titleEn` | `교육받은교사(수정)` |
| `textbookName` / `detailedProgramName` | `사회공헌 프로젝트` |
| `sponsorId` | `163302` |
| `managerName` | `문디지털` |
| `contactPhone` | `010-1630-0003` |
| `venue` / `venueDetail` / `venueKind` | `교육받은교사(수정)` / `inside` |
| `institutionType` | `inside_school` |
| `educationProcess` | `Digital (Computer)` |
| `ipOwned` | `Jointly` |
| `courseDeliveredBy` | `Partner` |
| `businessArea` | `진로취업` |
| `educationStructure` | `SCHEDULE` |

sponsors API도 `{ sponsorId: "163302", sponsorContactId: "163323", sponsorContactName: "문디지털" }` 로 정상.

### 같은 시점 목록 GET `186034` — 미러 누락

| 필드 | 상세 | 목록 |
|---|---|---|
| `textbookName` | `사회공헌 프로젝트` | `null` |
| `managerName` | `문디지털` | `테스트 마스터 관리자` (생성 관리자) |
| `venue` / `district` / `contactEmail` / `contactPhone` | 값 있음 | `null` |
| `educationProcess` / `ipOwned` / `courseDeliveredBy` / `institutionType` / `teamDivision` | 값 있음 | `null` |
| `rounds` | 1건 | `[]` |

시드 `186001`~`186008` 목록에도 `venue`/`contactEmail` 등은 전부 `null`입니다.  
`textbookName`은 시드 목록에는 값이 있으므로, **신규 수정분이 목록 `textbookName`에 안 붙는 것**이 핵심입니다.

### JSON 이중 카피 (P0)

`GET …/186034` 의 `serviceDetailJson` 과 `GET …/trained-teacher/detail` 의 `configJson` 이 **거의 같은 거대 blob**입니다. 한 JSON 안에 서로 다른 후원사/교재명이 공존합니다.

| 경로 | 후원사 | 담당자 | 교재/세부명 |
|---|---|---|---|
| top-level + `sponsors` | `163302` | `163323` 문디지털 | `사회공헌 프로젝트` |
| `*.program.generalCommonInfo` | `sponsorManagementIds: ["163302"]` | `163302::163323` | `detailedProgramName: 사회공헌 프로젝트` · **`textbookName: UJAT 사전교육`** |
| 루트 `*.generalCommonInfo` | **`["1627251"]` (구값)** | **`1627251::1627253`** | `사회공헌 프로젝트` |

FE write 계약은 오직:

```json
{
  "schemaVersion": 1,
  "program": { "generalCommonInfo": { }, "generalSurveyMenuKeys": [], "…": "…" }
}
```

루트 `generalCommonInfo` · 루트 `title`/`sponsorId`/`businessStartDate` 평탄 미러는 **FE가 보내지 않습니다.** BE가 붙여 넣고, PATCH merge 시 구 루트가 안 지워집니다.

### 교육 연수 일정명 잔여

```json
{
  "teacherTrainingEnabled": false,
  "teacherTrainingScheduleName": "교육 연수"
}
```

OFF인데 일정명이 남습니다. FE는 이후 PATCH에서 `teacherTrainingScheduleName: ""` 를 보냅니다. **빈 문자열을 no-op로 두지 말고 clear** 해 주세요.

---

## 기대 계약

### 1. JSON SSOT (P0)

| 규칙 | 내용 |
|---|---|
| programs `serviceDetailJson` | FE `{ schemaVersion: 1, program: Partial<Program> }` **그대로 persist**. 루트 `generalCommonInfo` / 평탄 프로그램 컬럼 미러 **금지** |
| PATCH | 기존 JSON과 **merge 금지**. 요청 `serviceDetailJson`으로 **교체** |
| `trained-teacher/detail` `configJson` | programs `serviceDetailJson` 전체를 복사하지 말 것. detail PATCH body의 `configJson`만 저장 |
| 재조회 | `GET programs/{id}.serviceDetailJson` === 마지막 PATCH body (BE가 키를 추가하지 않음) |
| 구 복본 | 루트 `generalCommonInfo.sponsorManagementIds` 가 `program.generalCommonInfo` 와 **같아야** 함. 다르면 merge 잔존 |

`program.generalCommonInfo`에 넣지 말 것 (Program 컬럼이지 commonInfo가 아님):  
`title`, `titleEn`, `mainTitle`, `textbookName`, `sponsorId`, `managerName`, `venue`, `contactEmail`, `contactPhone`, `businessArea`, `educationProcess`, …

공통 정보 nested에 둘 것:  
`announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `sponsorManagerContactIds`, `venueKind`, `venueDetail`, `scheduleDetails`, `curriculumSessions`, `educationScheduleLines`, `educationFormLabel`, `ipsScheduleDetail`, `teacherTrainingEnabled`, `educationJournalEnabled`, `kpi`, `participantRecruitmentInfo`

### 2. 목록 echo (P1, 상세와 동일 컬럼)

`GET /api/admin/programs?programType=TRAINED_TEACHER` 항목에 상세와 같은 값을 내려 주세요. 최소:

| 필드 | 비고 |
|---|---|
| `textbookName` / `detailedProgramName` | 시드는 이미 목록에 있음. 신규 수정도 동일 |
| `managerName` | **후원사 담당자명** (`sponsors.sponsorContactName`). 생성 관리자(`테스트 마스터 관리자`)로 덮지 말 것 |
| `venue` | |
| `contactPhone` / `contactEmail` | |
| `educationProcess` / `ipOwned` / `courseDeliveredBy` / `partnerInvolvement` | |
| `institutionType` / `teamDivision` / `district` | |

`rounds: []` 로 비우는 것은 목록 경량화면 문서화. 공통 정보 저장 실패로 보이지 않게.

### 3. 교육 연수 clear (P1)

| 요청 | 재조회 |
|---|---|
| `teacherTrainingEnabled: false` | `false` |
| `teacherTrainingScheduleName: ""` 또는 생략+false | **`null` 또는 빈 값**. `"교육 연수"` 잔존 금지 |
| `teacherTrainingEnabled: true` | `teacherTrainingScheduleName` = `교육 연수` (또는 FE가 보낸 값) |

### 4. 유지

- top-level `title`/`mainTitle`/`textbookName`/`venue`/`sponsors` 라운드트립 (2026-09-17 미러) **유지**
- `GET …/sponsors` 가 후원·담당자 SSOT
- 일반 프로그램 `serviceDetailJson` 스키마 변경 금지

---

## 하면 안 되는 것

| ❌ | ✅ |
|---|---|
| PATCH `serviceDetailJson`을 기존 blob에 deep merge | 요청 JSON으로 교체 |
| 루트 `generalCommonInfo` + `program.generalCommonInfo` 이중 유지 | envelope 한 벌 |
| `configJson` = programs `serviceDetailJson` 통짜 복사 | detail 전용 config만 |
| 목록 `managerName` = 생성 관리자 | 후원사 담당자 |
| `teacherTrainingEnabled: false` 인데 일정명 keep | clear |

---

## FE 현황 (참고)

FE는 이미:

- 조회 시 `program.generalCommonInfo` 우선, 루트 구 복본 무시
- programs GET 후원사 id가 stale `configJson` 루트를 덮지 않게 merge
- 다음 PATCH `serviceDetailJson`에서 nested `textbookName`/`title`/불일치 `sponsorManagementId` 제거
- 교육 연수 OFF 시 `teacherTrainingScheduleName: ""`

이 우회는 **화면 원복을 줄일 뿐**, BE가 루트 미러를 계속 붙이면 blob은 다시 커집니다.  
BE가 본 계약을 수용하면 FE 우회는 유지해도 무해합니다.

목록 누락·일정명 clear는 FE가 대신할 수 없습니다.

---

## 수락 기준 (QA)

1. `186034`(또는 동등 신규 TT) 공통 정보에서 후원사·세부 프로그램명·장소를 바꾼 뒤 저장 → `GET programs/{id}` **top-level + `serviceDetailJson.program.generalCommonInfo` 만** 신값. 루트 `generalCommonInfo`가 있으면 **동일 신값** (구 `1627251` 없음).
2. `GET trained-teacher/detail` `configJson`에 programs 전체 blob이 없고, 루트 vs `program` 후원사 id가 어긋나지 않음.
3. 같은 프로그램 목록 행의 `textbookName`/`managerName`(담당자)/`venue` 가 상세와 같음.
4. 교육 연수 OFF 저장 → GET `teacherTrainingScheduleName` 비어 있음.
5. 일반 프로그램 상세 공통 정보 라운드트립 **회귀 없음**.

---

## BE 이슈/PR 본문 (복사용)

아래만 복사해서 백엔드 이슈에 붙여 주세요.

### 요청 요약

CMS 교육받은 교사 공통 정보 저장 후 상세 top-level은 맞지만, `serviceDetailJson` / `trained-teacher/detail` `configJson`에 **구 후원사·구 교재명이 루트 `generalCommonInfo`로 남습니다.**  
목록 GET은 같은 필드가 `null`이거나 생성 관리자명입니다.

### 재현

- programId `186034` (2026-09-21)
- 상세: `sponsorId=163302`, `textbookName=사회공헌 프로젝트`, `managerName=문디지털`
- JSON 루트 `generalCommonInfo.sponsorManagementIds = ["1627251"]` (구값)
- JSON `program.generalCommonInfo.textbookName = "UJAT 사전교육"` (구값)
- 목록: `textbookName=null`, `managerName=테스트 마스터 관리자`

### 요청

1. `PATCH /api/admin/programs/{id}` 의 `serviceDetailJson`은 요청 body로 **교체**. 루트 `generalCommonInfo` 미러 금지. FE envelope `{ schemaVersion:1, program:{…} }` 유지.
2. `PATCH …/trained-teacher/detail` 의 `configJson`에 programs JSON 통짜 복사 금지.
3. 목록 항목에 상세와 동일한 `textbookName`, `venue`, 후원사 담당자 `managerName` echo.
4. `teacherTrainingEnabled: false` + `teacherTrainingScheduleName: ""` → 일정명 clear.

### 수락

- 재조회 JSON에 후원사/교재명 구값 없음
- 목록 = 상세 (해당 컬럼)
- 교육 연수 OFF 시 일정명 없음
- GENERAL 회귀 없음
