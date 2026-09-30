# BE 수정 요청 — Portal 공개 상세: 공통정보 교육 진행 정보 + 모집 양식 비고

**작성일:** 2026-09-29  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**우선순위:** P0  
**대상 API:**  
- `GET /api/portal/programs/{programId}`  
- `GET /api/portal/programs/{programId}/form-bindings/{bindingId}`  
**적용:** 일반 개인·기관 (`GENERAL_INDIVIDUAL` · `GENERAL_ORGANIZATION`). 다른 유형의 일정 장식·비고 규칙을 바꾸지 말 것.  
**범위 제외:**  
- Admin `GET /api/admin/programs/{id}` 계약 변경  
- Portal에 `serviceDetailJson` 통째 노출  
- 임금·KPI·후원사·설문 메뉴 등 **교육 진행 정보가 아닌** 공통정보

관련: CMS 공통정보 SSOT [`general-program-service-detail-json-ssot-backend-request-2026-09-28.md`](./general-program-service-detail-json-ssot-backend-request-2026-09-28.md)

---

## 백엔드 전달용 프롬프트

Platform 프로그램 상세·신청은 CMS **공통정보 > 교육 진행 정보**를 써야 한다.

지금 Portal `GET /api/portal/programs/{id}` 는 그 블록이 없다. `curricula[]`·`schedules[]` 는 **운영 회차/커리큘럼 테이블**이지 공통정보 차시·사전교육·교육 진행 예정일이 아니다.

FE는 `schedules` / `rounds` / 시드 4월 날짜 / overlay / admin blob 으로 보완하지 않는다. **아래 1차 필드를 내려라.**

같은 GET에 **모집 양식 「비고」** (`remarks`) 도 공개한다. `otherMatters`로 메우지 마라.

---

## 0. 재현 (2026-09-29 실측, `186021`)

프로그램: `GENERAL_INDIVIDUAL` 「개인 커리큘럼 복수」

| 층 | 값 | 맞음? |
|----|-----|------|
| Admin 공통정보 `educationScheduleLines` | `26년 10월 13일(화) 10:00 ~ 12:00`, `26년 10월 20일(화) 13:30 ~ 16:00` | **SSOT** |
| Admin `educationScheduleMode` | `date` | **SSOT** |
| Portal GET | `educationStructure` / `sessionRound` / `curriculumSessions` / `scheduleDetails` / `educationScheduleLines` / `scheduleCurriculumPreEducation` **없음** | 교육 진행 정보 없음 |
| Portal `curricula[0]` | title `1사1교 금융특강`, sessions 2건, durationMinutes `73440` | 공통정보 차시가 아님 |
| Portal `schedules[0]` | `scheduleId` 186597, `2026-10-03T15:00:00Z` ~ `2026-11-23T15:00:00Z`, `allDay: true` | 회차 운영 기간. 예정일·사전교육 아님 |
| form-bindings items | `26년 10월 4일(일) 00:00 ~ 00:00` | **틀림** |
| Portal `remarks` | `일정은 학교 사정에 따라 조율할 수 있습니다.` | 모집 양식 비고와 **같아야** 함 |

`curricula`·`schedules` 기존 키는 유지해도 된다. **교육 진행 정보의 대체로 쓰지 마라.**

---

## 1. 계약 — 공통정보 「교육 진행 정보」 전부

`GET /api/portal/programs/{programId}` 에 **1차 필드**를 추가한다. 기존 키는 유지.

소스: Admin persist `generalCommonInfo` + `generalProgramEducationStructure` / `generalProgramSessionRound`.  
overlay `generalRegistration.*` 만 있고 nested가 비면 **같은 의미로 채워 내린다.** blob을 Portal에 주지 마라.

### 1.0 구조·유형

| 필드 | 타입 | CMS |
|------|------|-----|
| `educationStructure` | `"curriculum"` \| `"schedule"` | 교육 진행 구조. 커리큘럼형 / 일정형 |
| `sessionRound` | `"single"` \| `"multi"` | 수업 회차 유형. 단일 / 복수 |
| `scheduleCurriculumPreEducation` | `boolean` | 사전 교육 토글 |
| `educationFormScheduleDetail` | `"common"` \| `"perSchedule"` | 교육 형태 일정 공통 / 일정 별 상이 |
| `participationScheduleDetail` | `"common"` \| `"perSchedule"` \| `null` | 참여 방식. **기관이면 null** |
| `ipsScheduleDetail` | `"common"` \| `"perSchedule"` | IPS 일정 공통 / 별 상이 |
| `educationFormLabel` | `string` \| `null` | 일정 **공통**일 때만 한글 라벨. perSchedule이면 null |
| `participationMethod` | `"individual"` \| `"team"` \| `null` | 개인 + 일정 공통일 때만. 기관·perSchedule이면 null |
| `ipsTypeSummary` | `string` \| `null` | 일정 **공통** IPS 표시. perSchedule이면 루트 null, 행만 |

### 1.1 커리큘럼형 — 차시 / 회차

`educationStructure === "curriculum"` 이면 `curriculumSessions` 필수. 일정형이면 `[]`.

기존 Portal `curricula[]` 와 **별개**. `186021` curricula 제목으로 채우지 마라.

각 원소:

| 필드 | 타입 | 의미 |
|------|------|------|
| `sessionLabel` | `string` | `1차시` / `1회차` 등 |
| `title` | `string` | 단원명 또는 진행 차시 |
| `description` | `string` | 교육 내용 |
| `assignmentEnabled` | `boolean` \| omit | 복수 회차 과제 |
| `assignmentPeriod` | `string` \| omit | 과제 기간 표시 문자열 |
| `educationFormLabel` | `string` \| omit | perSchedule일 때 행 라벨 |
| `participationMethodLabel` | `string` \| omit | 개인 + perSchedule |
| `ipsTypeSummary` | `string` \| omit | perSchedule 행 IPS |
| `scheduleDateLabel` | `string` \| omit | 커리큘럼 사전 교육 진행 일정 표시 |

순서 = CMS 화면 순서. 빈 가짜 차시 금지.

### 1.2 일정형 — 사전교육 · 세부/행사 일정

`educationStructure === "schedule"` 이면 `scheduleDetails` 필수. 커리큘럼형이면 `[]`.

기존 Portal `schedules[]`(회차 instant)와 **별개**.

각 원소:

| 필드 | 타입 | 의미 |
|------|------|------|
| `scheduleLabel` | `string` | `세부 일정 01` / `행사 일정 01` |
| `blockKind` | `"preEducation"` \| `"sub"` \| `"event"` | 사전 교육 / 세부 / 행사 |
| `name` | `string` | 일정명 |
| `scheduleDateLabel` | `string` \| omit | 진행 일정 표시 |
| `progressTimeSummary` | `string` \| omit | `13:30 ~ 15:30` 또는 `그룹 A : … \| 그룹 B : …` |
| `groupTimes` | `{ startTime, endTime }[]` \| omit | 그룹 시각. summary와 모순 금지 |
| `assignmentEnabled` | `boolean` \| omit | |
| `assignmentPeriod` | `string` \| omit | |
| `educationFormLabel` | `string` \| omit | perSchedule |
| `participationMethodLabel` | `string` \| omit | |
| `ipsTypeSummary` | `string` \| omit | |

`scheduleCurriculumPreEducation === true` 이면 배열 **첫 원소** `blockKind` = `"preEducation"`. 끄면 preEducation 행 없음.

`scheduleGroupCount` 를 쓰면 숫자(1~4). 없어도 `groupTimes` 길이로 충분.

### 1.3 교육 진행 예정일 목록

| 필드 | 타입 | 의미 |
|------|------|------|
| `educationScheduleMode` | `"date"` \| `"period"` | 날짜 지정 / 기간 지정 |
| `educationScheduleLines` | `string[]` | **표시 문자열 그대로**. 순서 유지 |
| `educationScheduleRange` | `{ start: string, end: string }` \| `null` | 기간 지정일 때 ISO. date 모드면 null |

일정형 + 복수 회차면 세부내용 「교육 일정 N」은 비노출이지만, **배열은 공통정보 그대로** 내린다. FE가 숨긴다. 서버가 지우지 말 것.

하면 안 되는 일:

1. `schedules[]` / `rounds[]` / 사업 기간으로 `educationScheduleLines` 만들기  
2. all-day instant → `00:00 ~ 00:00`  
3. 게시 양식 시드(4월)로 채우기  
4. `serviceDetailJson` 통째 노출  
5. overlay `educationScheduleSettings.scheduleLines`만 주고 1차 필드는 빼기  
6. `curricula[]`를 `curriculumSessions` 대신 쓰기  

Platform 상세:

- 커리큘럼형 기본정보 차시/회차 ← `curriculumSessions`  
- 일정형 기본정보 세부·행사·사전교육 ← `scheduleDetails`  
- 세부내용 「교육 일정 N」·신청 선택지 ← `educationScheduleLines`  

`186021` 예정일 필수:

```json
{
  "educationStructure": "curriculum",
  "sessionRound": "multi",
  "educationScheduleMode": "date",
  "educationScheduleLines": [
    "26년 10월 13일(화) 10:00 ~ 12:00",
    "26년 10월 20일(화) 13:30 ~ 16:00"
  ],
  "scheduleDetails": [],
  "curriculumSessions": []
}
```

`curriculumSessions` 는 CMS 공통정보 차시/회차 **실데이터**로 채운다. 위 예는 키 존재용. 빈 배열이면 CMS에도 없어야 한다. 문자열이 공통정보와 **한 글자도 다르면 실패**.

---

## 1.4 계약 — 모집 양식 비고 → `remarks`

`remarks` = CMS 모집 양식 **비고**.

1. 개인: overlay `recruit.individual.notes`  
2. 기관: overlay `recruit.notes`  
3. `participantRecruitmentInfo.remarks` / top-level `remarks` (overlay와 같게)

`notesNotApplicable === true` 이면 `remarks` 는 `null` 또는 `""`.

하면 안 되는 일: `otherMatters` / `recruit.detailInfo.otherNotes` / 공통정보 notes / 한줄소개를 비고로 쓰기. overlay만 있고 `remarks` 비우기.

`186021` 실측 `remarks` = `일정은 학교 사정에 따라 조율할 수 있습니다.` — 모집 양식 비고와 같으면 유지.

---

## 2. 계약 — form-bindings 장식

진행 희망 교육 일정 단락을 `runtimeInputMode: "fixed_schedule_options"` 로 장식할 때:

- `items[].label` · `runtimeContext.scheduleOptions` = **§1.3 `educationScheduleLines`**
- `mode === "date"` 이고 줄 2개 이상이면 그 줄이 체크박스
- 줄 없으면 회차 기간으로 덮지 말 것. 시드 유지 또는 기존 숨김만

하면 안 되는 일:

1. `scheduleId` 186597 / round 기간으로 선택지 1줄  
2. UTC → `26년 N월 N일 00:00 ~ 00:00`  
3. 날짜 지정 개인 신청에 기관 1·2지망 UI

`186021` form-bindings: items = 10/13 · 10/20 두 줄. `10월 4일 00:00` · 시드 4월 **없음**.

### 2.1 개인 신청 schemaJson 을 바꾸지 말 것 (`186020` 실측)

CMS published `schemaJson` 과 Portal form-bindings `form` 이 **같은 templateVersionId** 여도 Portal 이 단락을 변형하고 있다.

| 단락 | CMS published | Portal form-bindings | CMS 신청 정보 미리보기 |
|------|---------------|----------------------|-------------------------|
| `…-team-info` | `requiredMark: true` | `hidden` + `runtimeHidden` + `requiredMark: false` + `hiddenQuestionKeys` | **노출** (참여 방식 팀) |
| `…-schedule` | 시드 객관식 유지 | `hidden` + `scheduleInputMode: hidden` | **숨김** (일정형+복수 회차) |
| `…-interview-schedule` | 제목 「면접 진행 가능 일정」 | 그대로 내려줌 | **제거** (개인 신청에 면접 단락 없음) |

하면 안 되는 일:

1. `INDIVIDUAL` 이라는 이유만으로 `team-info` 를 `hiddenQuestionKeys` 에 넣기. **`participationMethod === team` 이면 숨기지 말 것.** 숨기면 Platform 제출이 `Hidden runtime form question` 으로 깨지거나 팀 정보가 빠진다.
2. published `schemaJson` 의 `requiredMark` / `answerRequired` 를 내리면서 false 로 덮기.
3. 개인 신청에 봉사자 「면접 진행 가능 일정」을 남기기. CMS `migrateProgramParticipantApplicationParagraphs` 와 같이 빼라.
4. 일정형+복수에서 시드 4월 날짜를 Platform 에 보여 주기. 단락 숨김은 CMS 와 같게 유지. 선택지를 보여줄 때는 §1.3 `educationScheduleLines` 만.

---

## 3. 검수

- [ ] `186021` GET에 §1.0~1.3 키. `educationScheduleLines` 두 줄이 공통정보와 동일  
- [ ] `curriculumSessions` = 공통정보 차시/회차. `curricula[0].title`(`1사1교 금융특강`)으로 대체하지 않음  
- [ ] 일정형 프로그램 1건: `scheduleDetails`에 사전교육(`blockKind: preEducation`) + 본 일정. `schedules[]` instant로 만들지 않음  
- [ ] `serviceDetailJson`을 FE 필수로 두지 않음  
- [ ] form-bindings items = 예정일 두 줄  
- [ ] 모집 비고 → `remarks`. `otherMatters`와 분리  
- [ ] `GENERAL_ORGANIZATION` 1건도 교육 진행 정보 동일 키 (참여 방식은 null)

---

## 4. 회신

1. 교육 진행 정보 1차 필드 목록 (구조·차시·사전교육·예정일)  
2. form-bindings 가 `educationScheduleLines`를 쓰는지  
3. `186021` GET 실측 (교육 진행 필드 + remarks)  
4. 일정형 1건 GET (`scheduleDetails` + preEducation)  
