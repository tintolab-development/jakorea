# BE 전달 프롬프트 — 교육받은 교사 공통 정보 저장이 `generalCommonInfo`를 일정 키만 남기고 지운다

**작성일:** 2026-09-22  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0. 공통 정보 저장 1회마다 필드가 사라진다.  
**대상:** `programType=TRAINED_TEACHER` 만  
**비범위:** GENERAL / 1사1교 / UJAT / Gemini 의 RFC-7396 merge 는 건드리지 말 것.

선행 핸드오프가 **고쳤다고 한 동작이 로컬 `localhost:8080` 에서 실패**한다.

- FE 요청: `apps/cms/docs/api/trained-teacher-common-info-field-roundtrip-backend-prompt-2026-09-22.md`
- BE 회신: `trained-teacher-common-info-field-roundtrip-frontend-handoff-2026-09-22.md` (2026-09-22)

회신이 말한 계약: A는 envelope 로 **교체**, B는 일지·연수·커리큘럼·일정 키만 **overlay**. overlay 가 공고명·세부명·후원 id 를 지우면 안 된다.  
실제 GET 은 overlay 가 아니라 **`generalCommonInfo` 객체 교체**다. B 키만 남고 나머지는 삭제된다.

---

## 한줄

공통 정보 저장(A `PATCH /api/admin/programs/{id}` 다음 B `PATCH /api/admin/programs/{id}/trained-teacher/detail`) 직후,  
`serviceDetailJson.program.generalCommonInfo` 가 아래 4개 키만 가진다.

- `educationJournalEnabled`
- `teacherTrainingEnabled`
- `teacherTrainingScheduleName`
- `scheduleDetails`

`announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `sponsorManagerContactIds`, `venueKind`, `venueDetail`, `kpi`, `educationScheduleLines` 는 **요청에 있었어도 GET 에서 없다.**  
top-level `title` 만 살고, `textbookName` / `detailedProgramName` / `venue` 컬럼은 `null` 이다.

이건 단락을 동적으로 늘려서 생기는 문제가 아니다. **같은 `config_jsonb` 를 A가 쓴 뒤 B가 통째로 덮는 문제**다.

---

## 실패 증거 (로컬, 재조회만으로 재현)

프로그램 `186034`. `updatedAt` `2026-09-22T01:33:39.794271Z`.  
`GET /api/admin/programs/186034`

top-level:

| 필드 | 실제 |
|---|---|
| `title` | `교육받은교사(수정4)` |
| `educationStructure` | `SCHEDULE` |
| `sponsorId` | `1627251` |
| `textbookName` | `null` |
| `detailedProgramName` | `null` |
| `venue` | `null` |
| `partnerInvolvement` | `null` |

`serviceDetailJson` (파싱 후):

```json
{
  "schemaVersion": 1,
  "program": {
    "generalCommonInfo": {
      "educationJournalEnabled": false,
      "teacherTrainingEnabled": false,
      "teacherTrainingScheduleName": "",
      "scheduleDetails": [
        {
          "scheduleLabel": "세부 일정 01",
          "name": "교육받은교사(수정4)",
          "progressTimeSummary": "15:43 ~ 16:43",
          "assignmentEnabled": false,
          "ipsTypeSummary": "Inspire | Kick-Off event (킥오프 행사)",
          "scheduleDateLabel": "26년 9월 8일(화)"
        }
      ]
    }
  }
}
```

없는 키: `announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `sponsorManagerContactIds`, `venueKind`, `venueDetail`, `kpi`, `educationScheduleLines`, `educationScheduleMode`, `educationScheduleRange`.

`GET /api/admin/programs/186034/trained-teacher/detail` 의 `configJson`:

```json
{
  "schemaVersion": 1,
  "generalCommonInfo": {
    "educationJournalEnabled": false,
    "educationJournalRequired": false,
    "journalSubmissionLimitType": "UNLIMITED",
    "teacherTrainingEnabled": false,
    "teacherTrainingScheduleName": "",
    "scheduleDetails": [ "...위와 동일한 1행..." ]
  }
}
```

programs JSON 과 detail JSON 의 `generalCommonInfo` 키 집합이 거의 같다.  
A가 넣은 공고·세부·후원·장소가 B 저장 시점에 지워진 것이다.  
`educationJournalRequired` / `journalSubmissionLimitType` 은 detail 쪽에만 있다. programs 쪽 `generalCommonInfo` 는 B가 남긴 부분집합이다.

일정 행의 `name`, `progressTimeSummary` 는 **이 스냅샷에는** 남아 있다.  
그래도 화면에서 일정명만 바꿔 저장하면 공고·세부·후원·장소가 또 비는 구조라, 일정 수정이 계속 실패한 것처럼 보인다.  
일정명 `교육받은교사(수정3)` 과 제목 `교육받은교사(수정4)` 가 달라야 하는데, 저장된 `scheduleDetails[0].name` 은 제목과 같은 `교육받은교사(수정4)` 다. 제목을 일정명에 복사하지 말 것.

---

## 원인 (추정 금지, 이 동작만 고칠 것)

`config_jsonb` 컬럼을 두 API가 같이 쓴다.

1. A `PATCH /api/admin/programs/{id}` 가 `{ schemaVersion:1, program:{ generalCommonInfo } }` 를 쓴다.
2. B `PATCH …/trained-teacher/detail` 가 그 컬럼의 `generalCommonInfo` 를 **일지·연수·일정만 있는 객체로 교체**한다.
3. 그 결과 A가 방금 쓴 키가 사라진다. 회신이 말한 overlay 가 아니다.

deep merge 로 구 blob 을 되살리는 것도 금지다. 그때는 구 공고명·구 차시가 다시 붙는다.  
해야 하는 것은 **요청에 있는 키는 유지하고, B가 안 보낸 키는 지우지 않는 것**이다.

---

## 저장 1회 = A 다음 B. 둘 다 이 계약을 지켜야 한다

### A. `PATCH /api/admin/programs/{id}`

FE envelope:

```json
{
  "title": "교육받은교사(수정4)",
  "mainTitle": "대표명",
  "textbookName": "사회공헌 프로젝트",
  "sponsors": [{ "sponsorId": "1627251", "sponsorContactId": "…" }],
  "educationStructure": "SCHEDULE",
  "serviceDetailJson": {
    "schemaVersion": 1,
    "program": {
      "generalCommonInfo": {
        "announcementTitle": "교육받은교사(수정4)",
        "detailedProgramName": "사회공헌 프로젝트",
        "sponsorManagementIds": ["1627251"],
        "sponsorManagerContactIds": ["1627251::…"],
        "venueKind": "other",
        "venueDetail": "별관 301호",
        "kpi": { "finalParticipants": 10, "finalSchools": 1, "finalClasses": 1, "instructorCount": 0, "volunteerCount": 0 },
        "scheduleDetails": [
          {
            "scheduleLabel": "세부 일정 01",
            "name": "교육받은교사(수정3)",
            "progressTimeSummary": "15:43 ~ 16:43"
          }
        ]
      }
    }
  }
}
```

- 요청 body 로 **교체**. 기존 blob 과 deep merge 금지.
- 루트 `generalCommonInfo` 만들지 말 것.
- nested 에서 지울 미러는 `title`, `textbookName`, `sponsorId`, `managerName`, `venue` **이 키 이름만**. `announcementTitle` / `detailedProgramName` / `sponsorManagementIds` / `scheduleDetails` 를 미러로 보고 지우지 말 것.
- `scheduleDetails[]` 를 `curriculumSessions[]` 로 변환하지 말 것. `name` 을 `title` 로 바꾸거나, `progressTimeSummary` 를 버리지 말 것.
- `scheduleDetails[0].name` 에 top-level `title` 을 복사하지 말 것. 일정명과 공고명은 다른 필드다.
- 연수 ON/OFF **컬럼**은 A가 덮지 않는다. 그건 B다.

### B. `PATCH /api/admin/programs/{id}/trained-teacher/detail`

```json
{
  "teacherTrainingEnabled": false,
  "educationJournalEnabled": false,
  "educationJournalRequired": false,
  "journalSubmissionLimitType": "UNLIMITED",
  "teacherTrainingScheduleName": "",
  "configJson": "{\"schemaVersion\":1,\"generalCommonInfo\":{ … }}"
}
```

B는 A가 쓴 `program.generalCommonInfo` 위에 **아래 키만 덮어쓴다.** 객체를 통째로 교체하면 실패다.

반드시 overlay (있으면 갱신, 없으면 추가, **없으면 삭제 금지**):

- `educationJournalEnabled`
- `teacherTrainingEnabled`
- `teacherTrainingScheduleName`
- `curriculumSessions`
- `scheduleDetails`
- `educationScheduleLines` / `educationScheduleMode` / `educationScheduleRange` (요청에 있을 때만 갱신)

절대 삭제하지 말 것 (B body 에 없어도 A 값을 유지):

- `announcementTitle`
- `detailedProgramName`
- `sponsorManagementIds` / `sponsorManagerContactIds` / `sponsorManagementId`
- `venueKind` / `venueDetail`
- `kpi`
- 그 외 A nested 에 이미 있는 키

`teacherTrainingEnabled: false` 이고 `teacherTrainingScheduleName: ""` 이면 컬럼은 빈 문자열. `"교육 연수"` 를 다시 넣지 말 것.  
일정 행의 `name` 이 사용자가 입력한 문구면 그 문구를 유지. `"교육 연수"` 로 되돌리지 말 것.

FE는 지금 B `configJson.generalCommonInfo` 에 폼 값(공고명·세부명·후원 id·일정 행)을 **같이** 보낸다.  
이전에 B를 일지·일정만 보냈을 때 서버가 그 객체로 컬럼을 통째로 바꿨기 때문이다.  
B body 에 그 키가 있으면 **버려지지 않고** 저장돼야 한다. allowlist 로 `announcementTitle` 을 드롭하면 또 실패다.

`configJson` 에 programs envelope 전체가 들어와도, 지우는 쪽은 미러 키(`title` / `textbookName` / `sponsorId` / `managerName` / `venue`)뿐이어야 한다. 공고명·세부명·일정명·진행 시간을 미러 취급하지 말 것.

---

## GET 이 이렇게 나오면 실패

`186034` 을 위에 적은 A→B 로 한 번 저장한 뒤:

### `GET /api/admin/programs/186034`

실패:

- `serviceDetailJson.program.generalCommonInfo` 키가 일지·연수·`scheduleDetails` 뿐
- `announcementTitle` 이 없음. 또는 top-level `title` 과 다름
- `detailedProgramName` 이 없음
- top-level `textbookName` 이 `null` 이거나 nested `detailedProgramName` 과 다름
- `sponsorManagementIds` 가 없음
- `venue` 컬럼이 `null` 인데 요청 `venueDetail` 은 있었음
- `scheduleDetails[0].name` 이 요청 일정명이 아니라 `title` 과 같음
- `scheduleDetails[0].progressTimeSummary` 가 없음
- `scheduleDetails` 가 `{ sessionNo, title }` 만 남음
- 루트 `serviceDetailJson.generalCommonInfo` 가 `program.generalCommonInfo` 와 다른 구값

성공:

- top-level `title` = nested `announcementTitle` = 마지막 공고명
- top-level `textbookName` = top-level `detailedProgramName` = nested `detailedProgramName` = 마지막 세부명
- nested `scheduleDetails[0].name` = 마지막 일정명 (공고명과 달라도 그대로)
- nested `scheduleDetails[0].progressTimeSummary` = 마지막 진행 시간 (`15:43 ~ 16:43` 형태 유지)
- nested `sponsorManagementIds` / `venueKind` / `venueDetail` / `kpi` 가 A 요청과 같음
- 루트 `generalCommonInfo` 없음

### `GET …/trained-teacher/detail`

실패:

- `configJson` 에 `announcementTitle` 또는 `sponsorManagementIds` 또는 `textbookName` 이 **구값으로** 다시 생김
- `scheduleDetails` 가 programs nested 와 다름 (한쪽만 구 일정명)
- `teacherTrainingEnabled: false` 인데 `teacherTrainingScheduleName` 이 `"교육 연수"`

성공:

- `teacherTrainingScheduleName` 은 OFF 면 `""`
- `scheduleDetails` / `curriculumSessions` 는 A nested 와 **같은 신값** (`name`, `progressTimeSummary` 포함)
- 일지·연수 플래그는 B 요청과 같음

### 목록 `GET /api/admin/programs?programType=TRAINED_TEACHER`

- 같은 id 의 `textbookName`, `venue`, `managerName`(후원사 담당자, 생성 관리자 아님)이 상세 컬럼과 같음
- `rounds: []` 는 정상. 저장 실패로 만들지 말 것

---

## 하면 안 되는 것

| 실패 | 요구 |
|---|---|
| B 저장 시 `generalCommonInfo` 를 일지·연수·일정 객체로 **교체** | B 키만 **overlay**. A 키 유지 |
| A 키를 allowlist 에 없다고 **드롭** | 요청에 있는 `announcementTitle` / `detailedProgramName` / `sponsorManagementIds` / `venueDetail` / `kpi` / `scheduleDetails.name` / `progressTimeSummary` 저장 |
| 기존 blob 과 deep merge 해서 구 공고·구 차시 부활 | 요청 값으로 해당 키만 갱신 |
| `title` 을 `scheduleDetails[0].name` 에 복사 | 일정명은 요청 `name` 만 |
| `scheduleDetails` 를 `curriculumSessions` 로 합치거나 `name`→`title` 로 축약 | 일정 행 필드 그대로 |
| `teacherTrainingEnabled: false` 인데 일정명을 `교육 연수` 로 채움 | `teacherTrainingScheduleName=""` , 사용자가 쓴 일정명은 유지 |
| programs JSON 과 detail JSON 에 서로 다른 일정명 | 둘 다 마지막 저장 행 |

---

## 수락 (이거 아니면 미완)

1. `186034` 공통 정보에서 공고명, 세부명, 일정명(`교육받은교사(수정3)`), 진행 시간(`15:43 ~ 16:43`)을 **서로 다른 값**으로 저장.
2. `GET /api/admin/programs/186034`  
   - `title` = nested `announcementTitle`  
   - `textbookName` = nested `detailedProgramName` ≠ `title`  
   - `scheduleDetails[0].name` = `교육받은교사(수정3)` ≠ `title`  
   - `scheduleDetails[0].progressTimeSummary` = `15:43 ~ 16:43`  
   - `sponsorManagementIds` 존재  
   - `generalCommonInfo` 키가 일지·연수·일정 **4개만이면 실패**
3. `GET …/trained-teacher/detail` 의 `scheduleDetails` 가 2번과 동일. `teacherTrainingScheduleName` 은 OFF 면 `""`.
4. 같은 저장을 한 번 더 해도 위 키가 줄지 않음.
5. GENERAL 프로그램 공통 정보 저장은 회귀 없음.

**Last updated:** 2026-09-22
