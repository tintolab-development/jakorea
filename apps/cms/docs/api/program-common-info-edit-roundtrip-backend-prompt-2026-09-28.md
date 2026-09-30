# BE 전달 프롬프트 — 프로그램 공통정보 수정 필드 왕복

**작성일:** 2026-09-28  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0. 화면에서 고친 공통정보가 저장 직후 GET에서 사라지거나 이전 값으로 돌아간다.  
**대상:** `PATCH /api/admin/programs/{id}` · `GET /api/admin/programs/{id}` · 1사1교 후원 배정 · UJAT `serviceDetailJson.registration.overlay` · 교육받은 교사 A→B 저장  
**비범위:** Gemini(찾아가는 연수) 공통정보 수정 API는 없다. 새로 만들지 말 것. 1사1교 봉사자 KPI는 항상 0이다. 그 값을 올리지 말 것.

FE는 공통정보 저장 시 빠지던 필드를 요청 body에 넣도록 맞췄다.  
아래 계약을 서버가 저장·재조회하지 않으면 화면은 다시 이전 값으로 보인다.

---

## 한줄

1. 부분 PATCH에 **있는 키는 그 값으로 저장**한다. `false` · `0` · 빈 배열을 “없음”으로 보고 기존 값이나 null로 바꾸지 마라.
2. 부분 PATCH에 **없는 키는 지우지 마라.** `serviceDetailJson` 객체 통째 교체, B detail PATCH가 A가 쓴 `generalCommonInfo`를 덮어쓰는 동작 금지.
3. GET은 방금 저장한 컬럼과 JSON을 **같은 이름·같은 값**으로 돌려준다.

---

## 공통 계약 (모든 programType)

`PATCH /api/admin/programs/{id}` 는 요청에 포함된 필드만 갱신한다.

| 요청에 있으면 | GET에 있어야 하는 곳 |
|---|---|
| `title` | top-level `title` |
| `mainTitle` | top-level `mainTitle` |
| `partnerInvolvement` (`true`/`false`) | top-level `partnerInvolvement`. `false`를 `null`로 쓰지 말 것 |
| `sponsors[]` | 후원 배정. `GET /api/admin/programs/{id}/sponsors` 와 상세의 담당자 재구성에 반영 |
| `educationStructure` | top-level `educationStructure` (`CURRICULUM` \| `SCHEDULE`) |
| `startDate` / `endDate` | top-level `startDate` / `endDate`. `businessStartDate` / `businessEndDate` 도 같은 값 |
| `rounds` | `rounds[]`. 1회차 `startDate`/`endDate`를 요청 값으로 갱신 |
| `serviceDetailJson` | 저장한 JSON. 요청에 있는 nested 키는 유지 |

`serviceDetailJson` 은 요청 body로 **이번 저장분**을 쓴다. 직전 blob과 deep merge해서 구 공고명·구 차시를 되살리지 마라.  
다만 **이번 요청에 없는 키를 삭제하는 쪽**도 금지다. 교육받은 교사 B 절을 따른다.

에러 `PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED` 는 **모집 기간 필드**(`applicationStartDate`, `applicationEndDate`, 강사·봉사자 모집 창, 결과 발표)에만 쓴다.  
공통정보의 사업 운영 기간(`startDate`/`endDate`)과 1회차 `rounds[0]` 날짜 갱신에는 이 에러를 내지 마라.

---

## 1. GENERAL

FE 공통정보 저장은 대표 프로그램명을 `title`과 `mainTitle`에 **같이** 보낸다. `title`만 옛 관리명으로 남기면 목록·상세가 어긋난다.

```json
{
  "title": "수정된 대표명",
  "mainTitle": "수정된 대표명",
  "partnerInvolvement": false,
  "totalParticipants": 40,
  "approvedStudentCount": 40,
  "instructors": 3,
  "instructorCapacity": 3,
  "generalVolunteers": 2,
  "participatingSchoolCount": 6,
  "serviceDetailJson": "{ \"program\": { \"generalCommonInfo\": { \"kpi\": { \"finalParticipants\": 40, \"instructorCount\": 3, \"volunteerCount\": 2, \"finalSchools\": 6, \"finalClasses\": 9 } } } }"
}
```

해야 할 것:

- `title` 과 `mainTitle` 을 둘 다 저장한다. 한쪽만 갱신하지 마라.
- `partnerInvolvement: false` 를 저장한다. 컬럼 기본값 `true` 나 `null`로 덮지 마라.
- KPI 숫자(`totalParticipants`, `approvedStudentCount`, `instructors`, `instructorCapacity`, `generalVolunteers`, `participatingSchoolCount`)와 `generalCommonInfo.kpi.*` 를 요청 값 그대로 저장한다.
- 요청에 KPI 키가 **없으면** 기존 KPI를 `0`으로 만들지 마라.

검수:

```http
PATCH /api/admin/programs/{generalId}
{ "title": "수정된 대표명", "mainTitle": "수정된 대표명", "partnerInvolvement": false }

GET /api/admin/programs/{generalId}
→ title === "수정된 대표명"
→ mainTitle === "수정된 대표명"
→ partnerInvolvement === false
→ generalCommonInfo.kpi 는 요청에 있던 숫자. 없는 키는 이전 값
```

---

## 2. COMPANY_SCHOOL (1사1교)

### 교육 진행 일정

편집 UI는 기간만 고른다. FE는 `generalCommonInfo.educationScheduleMode` 를 `"period"` 로 넣고, 기간 문구는 `educationScheduleLines` 에 넣는다.

```json
{
  "serviceDetailJson": {
    "program": {
      "generalCommonInfo": {
        "educationScheduleMode": "period",
        "educationScheduleLines": ["2026. 05. 01 ~ 2026. 11. 30"]
      }
    }
  }
}
```

GET의 `generalCommonInfo.educationScheduleMode` 가 없거나 `"date"` 로 떨어지면 실패다.

### 사업 운영 기간 = 1회차 날짜

운영 기간을 바꾸면 FE는 `startDate`/`endDate`/`businessStartDate`/`businessEndDate` 와 함께 `rounds` 를 보낸다. 1회차의 `startDate`/`endDate` 는 운영 기간과 같다.

```json
{
  "startDate": "2026-11-21T15:00:00.000Z",
  "endDate": "2026-12-22T15:00:00.000Z",
  "businessStartDate": "2026-11-21T15:00:00.000Z",
  "businessEndDate": "2026-12-22T15:00:00.000Z",
  "rounds": [
    {
      "roundNumber": 1,
      "startDate": "2026-11-21T15:00:00.000Z",
      "endDate": "2026-12-22T15:00:00.000Z",
      "status": "active"
    }
  ]
}
```

해야 할 것:

- 1회차 날짜를 요청 값으로 갱신한다.
- 이 요청에 모집 시작·종료가 **없으면** `PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED` 를 내지 마라.
- `businessStartDate`/`businessEndDate` 를 연도 1/1~12/31 로 다시 쓰지 마라. 요청 날짜를 그대로 둔다.

### 후원사 담당자

FE는 `sponsorId` 만 보내지 않는다. 담당자가 있으면 `sponsors[]` 에 배정 행을 넣는다.  
`sponsorContactId` 는 담당자 PK다. (`sponsorId::contactId` 형태를 컬럼에 그대로 저장하지 마라.)

```json
{
  "sponsorId": "163388",
  "sponsors": [
    { "sponsorId": "163388", "sponsorContactId": "contact-9" }
  ]
}
```

담당자를 고르지 않았으면 `{ "sponsorId": "163388" }` 만 있을 수 있다. 그때 기존 담당자 배정을 임의로 지우지 말고, 요청 배열이 **그 후원사의 전체 배정**이면 그 배열로 맞춘다. 다른 후원사 배정은 유지한다.

검수:

```http
PATCH /api/admin/programs/{companySchoolId}
위 sponsors body

GET /api/admin/programs/{companySchoolId}
→ sponsorId === "163388"

GET /api/admin/programs/{companySchoolId}/sponsors
→ sponsorId 163388 행의 sponsorContactId === "contact-9"

GET serviceDetailJson.program.generalCommonInfo.educationScheduleMode
→ "period"
GET rounds[0].startDate / endDate
→ 요청한 운영 기간과 동일
```

---

## 3. UJAT

### educationStructure

생성에는 `educationStructure` 가 필수다. **부분 수정도 같다.** FE는 공통정보 저장 시 이 필드를 보낸다.

```json
{
  "title": "수정된 UJAT",
  "educationStructure": "CURRICULUM",
  "ips": "Inspire",
  "sponsorId": "163388",
  "sponsors": [
    { "sponsorId": "163388", "sponsorContactId": "contact-9" }
  ]
}
```

FE는 공통정보 부분 수정에서 `ips` 와 `sponsors[]` 를 보낸다. `ips` 를 컬럼에 저장하지 않으면 GET `ips` 가 옛 값이고, 화면은 그 컬럼으로 overlay `ujat.basicInfo.ipsCategory` 를 다시 맞춘다. 수정한 IPS가 사라진다.

`sponsorContactId` 는 담당자 PK다. `163388::contact-9` 를 컬럼에 그대로 저장하지 마라.

허용 값: `CURRICULUM` | `SCHEDULE`.  
PATCH에서 이 키를 무시하면 안 된다. GET `educationStructure` 가 요청 값이어야 한다. 기본값 `SCHEDULE` 로 되돌려 덮지 마라. 요청이 `CURRICULUM` 이면 `CURRICULUM` 이다.

### 지역 정원 · 상·하반기 일정

이 값은 1차 컬럼이 아니다. `serviceDetailJson.registration.overlay` 에만 있다. FE는 저장 시 **세션 overlay 전체**를 `registration.overlay` 로 보낸다.

유지해야 하는 키 예:

- `ujat.capacity.byRegion` — 지역별 학급 수·봉사자 수 (`h1` / `h2`)
- 상·하반기 교육 일정·제외일 overlay 키 (`ujat.` 접두)

해야 할 것:

- 요청 `registration.overlay` 를 저장하고 GET에서 **같은 키·같은 값**으로 돌려준다.
- overlay를 알려진 기본정보 키만 남기는 whitelist로 자르지 마라. `ujat.capacity.byRegion` 이 요청에 있으면 GET에 있어야 한다.
- overlay를 비우거나, 생성 기본값(빈 정원·기본 일정)으로 바꾸지 마라.

검수:

```http
PATCH /api/admin/programs/{ujatId}
{
  "educationStructure": "CURRICULUM",
  "serviceDetailJson": {
    "version": 1,
    "registration": {
      "overlay": {
        "ujat.capacity.byRegion": {
          "h1": { "서울": { "classCount": "2", "volunteerCount": "4" } }
        }
      }
    }
  }
}

GET /api/admin/programs/{ujatId}
→ educationStructure === "CURRICULUM"
→ ips === "Inspire"
→ registration.overlay["ujat.basicInfo.ipsCategory"] === "inspire"
→ registration.overlay["ujat.capacity.byRegion"].h1.서울.classCount === "2"
→ 요청에 있던 다른 ujat.* overlay 키도 유지

GET /api/admin/programs/{ujatId}/sponsors
→ sponsorId 163388 행의 sponsorContactId === "contact-9"
```

---

## 4. TRAINED_TEACHER

저장은 항상 이 순서다.

1. A `PATCH /api/admin/programs/{id}` — 공고·후원·KPI·사업분야·차시/일정 행
2. 필요할 때만 B `PATCH /api/admin/programs/{id}/trained-teacher/detail` — 일지·연수·커리큘럼/일정 키만

선행 실패: `apps/cms/docs/api/trained-teacher-common-info-json-replace-wipes-fields-backend-prompt-2026-09-22.md`  
그 문서의 계약이 아직이면 이번 필드도 같이 사라진다. B가 `generalCommonInfo` 를 통째로 교체하지 마라.

### A가 추가로 넣는 행 필드

`generalCommonInfo.curriculumSessions[]` 와 `scheduleDetails[]` 안에 다음이 있으면 **그대로** 저장한다.

- `educationFormLabel` (예: `"오프라인"`)
- `ipsTypeSummary` (예: `"일정 공통 | Inspire | 학교"`)
- `participationMethodLabel` (예: `"팀"`)

일정명 `scheduleDetails[].name` 에 top-level `title` 을 복사하지 마라.  
`scheduleDetails` 를 `curriculumSessions` 로 바꾸거나, 위 세 키를 모르는 필드로 보고 버리지 마라.

```json
{
  "serviceDetailJson": {
    "program": {
      "generalCommonInfo": {
        "educationFormLabel": "오프라인",
        "educationFormScheduleDetail": "common",
        "ipsTypeSummary": "일정 공통 | Inspire | 학교",
        "curriculumSessions": [
          {
            "sessionLabel": "1차시",
            "title": "1차시",
            "educationFormLabel": "오프라인",
            "ipsTypeSummary": "일정 공통 | Inspire | 학교",
            "participationMethodLabel": "팀"
          }
        ]
      }
    }
  }
}
```

### B는 overlay만

B `configJson.generalCommonInfo` 에 있어도 되는 키는 기존과 같다.

- `educationJournalEnabled`
- `teacherTrainingEnabled`
- `teacherTrainingScheduleName`
- `curriculumSessions`
- `scheduleDetails`
- `educationScheduleLines`
- `educationScheduleMode`
- `educationScheduleRange`

B가 `curriculumSessions` 또는 `scheduleDetails` 를 보내면 **그 배열만** 요청 값으로 바꾼다. 원소의 `educationFormLabel` / `ipsTypeSummary` / `participationMethodLabel` 을 유지한다.  
B body에 없는 키(`announcementTitle`, `detailedProgramName`, `sponsorManagementIds`, `kpi`, `venueKind`, `educationFormLabel` 루트 등)는 A가 쓴 값을 유지한다.

검수:

```http
A PATCH programs/{trainedTeacherId}  (위 curriculumSessions)
B PATCH …/trained-teacher/detail     (일지·연수만 바꾼 configJson)

GET /api/admin/programs/{trainedTeacherId}
→ generalCommonInfo.announcementTitle 유지 (A에 있었으면)
→ generalCommonInfo.kpi 유지
→ curriculumSessions[0].educationFormLabel === "오프라인"
→ curriculumSessions[0].ipsTypeSummary 유지
→ curriculumSessions[0].participationMethodLabel === "팀"
→ educationJournalEnabled 는 B 값
```

---

## 하지 말 것

- Gemini용 공통정보 PATCH를 추가하지 마라.
- 1사1교 `generalVolunteers` / KPI `volunteerCount` 를 0이 아닌 값으로 채우지 마라. FE가 0을 보내면 0이다.
- 부분 PATCH에 없는 모집 기간을 공통정보 저장 때문에 갱신하거나, 그 반대로 운영 기간 갱신을 모집 기간 종료 에러로 거절하지 마라.
- `sponsors[].sponsorContactId` 에 `163388::contact-9` 문자열을 그대로 넣지 마라. 담당자 PK만 저장한다.

---

## 완료 조건

위 네 유형 각각, 공통정보 저장 1회 직후 `GET /api/admin/programs/{id}` 가 요청에 넣은 값을 돌려준다.  
교육받은 교사는 A 다음 B를 친 뒤에도 행의 교육형태·IPS·참여방식과 A의 공고·KPI가 같이 남아 있다.

일반 프로그램에서 교육 형태가 일정별이면 루트 `educationFormLabel` 은 비어 있을 수 있다. 회차 값은 `curriculumSessions[].educationFormLabel` / `scheduleDetails[].educationFormLabel` 과 `registration.overlay` 의 `educationFormBySession` / `educationFormByDetail` 에 있다. GET이 행 라벨을 빼면 화면은 온라인으로 돌아간다. 행 라벨을 요청 값 그대로 돌려줘라.
