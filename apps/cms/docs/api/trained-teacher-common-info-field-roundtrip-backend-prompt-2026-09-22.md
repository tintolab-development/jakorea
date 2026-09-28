# BE 전달 프롬프트 — 교육받은 교사 공통 정보 필드별 저장 후 구값 잔존

**작성일:** 2026-09-22  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**우선순위:** P0 (상세 재조회 원복) · P1 (목록 echo · 교육 연수 clear)  
**대상 화면:** CMS `/programs/trained-teachers?programId=…` LNB **공통 정보**  
**범위:** `programType=TRAINED_TEACHER` 만  
- `PUT|PATCH /api/admin/programs/{id}` (`serviceDetailJson` 포함)  
- `GET /api/admin/programs/{id}`  
- `GET /api/admin/programs?programType=TRAINED_TEACHER`  
- `GET|PATCH /api/admin/programs/{id}/trained-teacher/detail` (`configJson` 포함)  
**비범위:** 일반(`GENERAL`) · 1사1교 · UJAT · Gemini 기본 동작 변경 금지  

**관련 (선행, 본 문서만으로 구현 가능):**
- [trained-teacher-common-info-json-mirror-backend-prompt-2026-09-21.md](./trained-teacher-common-info-json-mirror-backend-prompt-2026-09-21.md) — JSON 이중 카피·목록 미러. **본 문서가 상세 라운드트립 계약을 갱신**
- [trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md](./trained-teacher-common-recruit-edit-roundtrip-backend-request-2026-09-17.md)
- OpenAPI v9 `ProgramUpdateRequest` / `ProgramResponse` / `TrainedTeacherProgramDetailRequest`

**FE 현황 (2026-09-22):** 화면에서 nested 구값을 가리는 우회는 반영됨. **BE가 JSON을 merge·이중 카피하면 blob은 계속 커지고**, 다음 저장에서 다시 섞일 수 있음.

---

## 한줄 요약

공통 정보를 저장하면 **어떤 필드는 반영되고 어떤 필드는 이전 값이 그대로**입니다.  
상세 GET **top-level 컬럼은 신값**인데, `serviceDetailJson` / `configJson` 안에 **구 공고명·구 세부명·구 커리큘럼**이 남아 재조회·다음 PATCH에서 원복됩니다.

요청:

1. PATCH `serviceDetailJson` / `configJson` 은 기존 blob과 **deep merge 하지 말고 요청 body로 교체**
2. 루트 `generalCommonInfo` 미러 금지. FE envelope `{ schemaVersion: 1, program: { … } }` 유지
3. GET top-level 과 nested 가 **같은 신값**. `title` = 공고용, `textbookName` = 세부 프로그램명
4. `trained-teacher/detail` `configJson`에 programs JSON **통짜 복사 금지**. 교육일지·연수·커리큘럼/일정만

---

## 재현 (2026-09-22)

1. CMS `/programs/trained-teachers` → 상세 공통 정보 「정보 수정」
2. 공고용 프로그램명을 `교육받은교사(수정)` → `교육받은교사(수정2)` 로 저장 (세부명·커리큘럼/일정도 함께 바꿔 보세요)
3. 저장 직후·모달 닫고 재진입

### 화면 증상

| UI | 저장 후 |
|---|---|
| 모달 헤더 (`title`) | **신값** `교육받은교사(수정2)` |
| 공고용 프로그램명 | nested 구값이면 **구값**이 남았음 (FE 우회 전) |
| 세부 프로그램명 | PATCH `textbookName` 신값 vs nested `detailedProgramName` 구값 |
| 대표 프로그램명(국문) `mainTitle` | 공고용과 **별 필드**. 공고용만 바꾸면 유지가 정상 |
| 커리큘럼 차시 / 일정형 세부일정 | programs JSON 구값 + detail 신값이 갈라지면 구값 표시 |

### Network

```http
PATCH /api/admin/programs/{id}
PATCH /api/admin/programs/{id}/trained-teacher/detail
GET  /api/admin/programs/{id}
GET  /api/admin/programs/{id}/trained-teacher/detail
GET  /api/admin/programs/{id}/sponsors
GET  /api/admin/programs?programType=TRAINED_TEACHER&page=0&size=20
```

한 JSON 안에 서로 다른 값이 있으면 실패입니다.

| 경로 | 기대 |
|---|---|
| GET top-level `title` | 마지막 공고용 |
| `serviceDetailJson.program.generalCommonInfo.announcementTitle` | **동일 신값** |
| 루트 `serviceDetailJson.generalCommonInfo` | **없어야 함**. 있으면 신값과 같아야 함 (구 후원사/구 교재명 금지) |
| GET `textbookName` / `detailedProgramName` | 마지막 세부 프로그램명과 동일 |
| `configJson` | 후원사 id·`textbookName`·programs 전체 blob **없음** |
| `configJson` 커리큘럼/일정 | 마지막 저장 테이블과 동일 |

---

## FE write 계약 (2026-09-22 이후)

저장 1회에 API가 **두 개**입니다. 필드 SSOT를 맞춰 주세요.

### A. `PATCH /api/admin/programs/{id}`

기본정보·후원·KPI·유형·교육 진행 예정일·**커리큘럼/일정 테이블**.

| UI | body |
|---|---|
| 공고용 프로그램명 | `title` + nested `announcementTitle` (값은 동일) |
| 대표 프로그램명 국문/영문 | `mainTitle` / `titleEn` (**title과 독립**) |
| 세부 프로그램명 | `textbookName` (+ nested `detailedProgramName`, **nested `textbookName` 키는 안 보냄**) |
| 후원사·담당자 | `sponsorId` + `sponsors[{ sponsorId, sponsorContactId }]` + nested ids |
| 교육 장소 | `institutionType` (`inside_school`/`outside_school`) 또는 기타 시 `venue` + nested `venueKind`/`venueDetail` |
| 교육과정 / IP / Course / Partner / 사업 분야 | top-level 컬럼 |
| KPI | `totalParticipants` / `educatedTeachers` / nested `kpi` |
| 교육 구조 | `educationStructure` = `CURRICULUM` \| `SCHEDULE` |
| 커리큘럼·일정 테이블 | **`serviceDetailJson.program.generalCommonInfo.curriculumSessions` / `scheduleDetails`** |
| 교육 진행 예정일 줄 | nested `educationScheduleLines` / `educationScheduleMode` / `educationScheduleRange` |

`serviceDetailJson` FE envelope:

```json
{
  "schemaVersion": 1,
  "program": {
    "generalCommonInfo": { },
    "generalSurveyMenuKeys": [],
    "generalProgramEducationStructure": "curriculum"
  }
}
```

FE가 **보내지 않는 것** (BE가 붙이지 말 것):

- 루트 `generalCommonInfo`
- 루트 평탄 미러 (`title`/`sponsorId`/`textbookName` 등을 JSON 루트에 복제)
- nested 안의 Program 컬럼 미러: `title`, `textbookName`, `sponsorId`, `venue`, `managerName`, `teacherTrainingScheduleName` 등

### B. `PATCH /api/admin/programs/{id}/trained-teacher/detail`

교육일지·교육연수·커리큘럼/일정만. **후원·공고·세부명·KPI를 넣지 않습니다.**

```json
{
  "teacherTrainingEnabled": false,
  "educationJournalEnabled": true,
  "educationJournalRequired": false,
  "journalSubmissionLimitType": "UNLIMITED",
  "teacherTrainingScheduleName": "",
  "configJson": "{\"schemaVersion\":1,\"generalCommonInfo\":{\"educationJournalEnabled\":true,\"teacherTrainingEnabled\":false,\"curriculumSessions\":[…]}}"
}
```

| 요청 | 재조회 |
|---|---|
| `teacherTrainingEnabled: false` + `teacherTrainingScheduleName: ""` | 일정명 **`null` 또는 빈 값**. `"교육 연수"` 잔존 금지 |
| `teacherTrainingEnabled: true` | 일정명 `교육 연수` (또는 FE가 보낸 값) |

`configJson`에 programs `serviceDetailJson` 전체를 복사하지 마세요.  
B body에 후원사/교재명이 없어도 **구값을 merge로 되살리지 마세요.**

---

## GET echo 계약

### 상세 `GET /api/admin/programs/{id}`

| 컬럼 | echo |
|---|---|
| `title` | 마지막 공고용 = nested `announcementTitle` |
| `mainTitle` / `titleEn` | 대표명. 공고용과 달라도 됨 |
| `textbookName` **및** `detailedProgramName` | 둘 다 마지막 세부명 (하나만 채워도 FE는 `detailedProgramName \|\| textbookName` 사용) |
| `venue` | 기타 장소 텍스트. nested `venueDetail` 과 동일 |
| `institutionType` | `inside_school` / `outside_school`. 기타면 비우고 `venue` |
| `totalParticipants` / `educatedTeachers` | KPI |
| `serviceDetailJson` | **마지막 A PATCH body와 동일** (BE가 키를 추가·구 루트를 남기지 않음) |

### `GET …/trained-teacher/detail`

| 필드 | echo |
|---|---|
| `teacherTrainingEnabled` / `educationJournalEnabled` | 마지막 B |
| `teacherTrainingScheduleName` | ON이면 이름, OFF면 비움 |
| `configJson` | 마지막 B `configJson`. programs blob·루트 vs `program.generalCommonInfo` 불일치 금지 |
| 커리큘럼/일정 | A nested 와 **같은 신값** (한쪽에만 구값 금지) |

### `GET …/sponsors`

후원·담당자 SSOT. 목록/상세 `managerName`은 생성 관리자가 아니라 **후원사 담당자명**.

### 목록 `GET /api/admin/programs?programType=TRAINED_TEACHER`

상세와 같은 컬럼 echo. 최소: `title`, `textbookName`/`detailedProgramName`, `managerName`(담당자), `venue`, `contactPhone`/`contactEmail`.  
목록 `rounds: []` 는 경량 계약 — 공통정보 저장 실패로 보이지 않게.

---

## 하면 안 되는 것

| ❌ | ✅ |
|---|---|
| PATCH JSON을 기존 blob에 deep merge | 요청 JSON으로 **교체** |
| 루트 `generalCommonInfo` + `program.generalCommonInfo` 이중 유지 | envelope 한 벌 |
| `configJson` = programs `serviceDetailJson` 통짜 복사 | B가 보낸 교육일지·연수·커리큘럼만 |
| B에 후원/교재명이 없다고 구 `configJson` keep | 구 키 삭제 |
| `title`만 갱신하고 nested `announcementTitle` keep | 둘 다 신값 |
| `textbookName`만 갱신하고 nested `detailedProgramName` keep | 둘 다 신값 |
| A에 신 커리큘럼, `configJson`에 구 차시 (또는 반대) | 두 API 동일 |
| `teacherTrainingEnabled: false` 인데 일정명 keep | clear |
| 목록 `managerName` = 생성 관리자 | 후원사 담당자 |

---

## 수락 기준 (QA)

1. 공통 정보에서 공고용·세부명·장소·커리큘럼(또는 일정)을 바꾼 뒤 저장 → `GET programs/{id}` **top-level + `serviceDetailJson.program.generalCommonInfo`만 신값**. 루트 `generalCommonInfo`가 있으면 동일 신값 (구 후원사/구 교재명 없음).
2. 모달 헤더·공고용 필드·`title`·nested `announcementTitle` 이 모두 같은 신값.
3. 세부명 UI = GET `textbookName` = nested `detailedProgramName`.
4. `GET trained-teacher/detail` `configJson`에 programs 전체 blob·후원사 id 없음. 커리큘럼/일정이 A nested 와 같음.
5. 교육 연수 OFF 저장 → GET `teacherTrainingScheduleName` 비어 있음.
6. 같은 프로그램 목록 행 `textbookName` / `managerName`(담당자) / `venue` 가 상세와 같음.
7. 일반 프로그램 상세 공통 정보 라운드트립 **회귀 없음**.

---

## BE 이슈/PR 본문 (복사용)

아래만 복사해서 백엔드 이슈에 붙여 주세요.

### 요청 요약

CMS 교육받은 교사 **공통 정보**를 저장하면 헤더(`title`) 등 일부만 바뀌고, 공고용·세부명·커리큘럼은 구값이 남거나 다음 저장에서 원복됩니다.

원인은 `PATCH /api/admin/programs/{id}` 의 `serviceDetailJson` 과 `PATCH …/trained-teacher/detail` 의 `configJson` 을 기존 blob에 **merge** 하면서, 루트 `generalCommonInfo`(구값)와 `program.generalCommonInfo`(신값)가 공존하기 때문입니다.

### 재현

- 화면: `/programs/trained-teachers` 상세 LNB 공통 정보
- 공고용을 `교육받은교사(수정)` → `교육받은교사(수정2)` 저장
- GET top-level `title` 은 신값, nested/루트 JSON 에 구 공고명·구 `textbookName` 잔존
- 커리큘럼을 바꾸면 programs JSON 과 `configJson` 차시명이 어긋남

### 요청

1. `PATCH /api/admin/programs/{id}` 의 `serviceDetailJson` 은 요청 body로 **교체**. 루트 `generalCommonInfo` 미러 금지. FE envelope `{ schemaVersion:1, program:{…} }` 유지.
2. 재조회 `title` = nested `announcementTitle`, `textbookName` = nested `detailedProgramName` = GET `detailedProgramName`.
3. `PATCH …/trained-teacher/detail` 의 `configJson` 에 programs JSON 통짜 복사 금지. FE는 교육일지·연수·커리큘럼/일정만 보냄. 빠진 키(후원·교재명)를 구 blob에서 merge 하지 말 것.
4. A nested 커리큘럼/일정 과 `configJson` 테이블이 **동일 신값**.
5. `teacherTrainingEnabled: false` + `teacherTrainingScheduleName: ""` → 일정명 clear.
6. 목록 item 에 상세와 동일한 `textbookName`, `venue`, 후원사 담당자 `managerName` echo.

### 수락

- 재조회 JSON에 후원사/교재명/공고명 **구값 없음**
- 헤더 = 공고용 = `title` = nested `announcementTitle`
- 세부명 = `textbookName` = nested `detailedProgramName`
- 커리큘럼/일정 A = B
- 교육 연수 OFF 시 일정명 없음
- 목록 = 상세 (해당 컬럼)
- GENERAL 회귀 없음
