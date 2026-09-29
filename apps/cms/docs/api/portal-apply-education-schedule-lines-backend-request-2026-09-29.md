# BE 수정 요청 — Portal 신청 「진행 희망 교육 일정」은 공통정보 `educationScheduleLines`

**작성일:** 2026-09-29  
**문서 성격:** **이 파일만** 보고 구현·검수 가능  
**우선순위:** P0  
**대상 API:**  
- `GET /api/portal/programs/{programId}`  
- `GET /api/portal/programs/{programId}/form-bindings/{bindingId}`  
**적용:** 일반 개인·기관 신청 (`GENERAL_INDIVIDUAL` · `GENERAL_ORGANIZATION`). 다른 유형의 일정 장식 규칙을 바꾸지 말 것.  
**범위 제외:** Admin `GET /api/admin/programs/{id}` 계약 변경. Portal이 **admin blob을 그대로 내려주는 방식**으로 해결하지 말 것.

관련: CMS 공통정보 일정 SSOT [`general-program-service-detail-json-ssot-backend-request-2026-09-28.md`](./general-program-service-detail-json-ssot-backend-request-2026-09-28.md) §2.1 `educationScheduleSettings.scheduleLines` ↔ `educationScheduleLines`

---

## 백엔드 전달용 프롬프트

Platform 「프로그램 신청하기」의 **진행 희망 교육 일정**이 CMS 공통정보에 등록한 교육 진행 예정일과 다르다.

원인은 Portal이 **공통정보 줄을 공개하지 않고**, form-bindings가 **회차/운영 기간(`schedules` · `rounds`)으로 객관식 items를 덮기** 때문이다.

FE는 다른 필드(`schedules`, `rounds`, 시드 4월 날짜, overlay 키, admin `serviceDetailJson`)로 보완하지 않는다. **Portal이 공통정보 줄을 1차 필드로 내리고, form-bindings 장식도 그 줄을 써야** 화면이 맞는다.

---

## 0. 재현 (2026-09-29 실측, `186021`)

프로그램: `GENERAL_INDIVIDUAL` 「개인 커리큘럼 복수」

| 층 | 값 | 맞음? |
|----|-----|------|
| Admin 공통정보 `serviceDetailJson.generalCommonInfo.educationScheduleLines` | `26년 10월 13일(화) 10:00 ~ 12:00`, `26년 10월 20일(화) 13:30 ~ 16:00` | **SSOT. 이 값을 써야 함** |
| Admin `educationScheduleMode` | `date` | **SSOT** |
| CMS 게시 양식 `schemaJson` items | 시드 `26년 4월 20일(일) 9:30 ~ 12:20`, `26년 4월 27일(월) 13:00 ~ 15:50` | 저장본. 런타임 SSOT 아님 |
| Portal `GET /api/portal/programs/186021` | `serviceDetailJson` **없음**. `generalCommonInfo` **없음**. `educationScheduleLines` **없음** | 공개 상세에 공통정보 일정 없음 |
| 같은 GET `schedules[0]` | `scheduleId` 186597, `startAt` `2026-10-03T15:00:00Z`, `endAt` `2026-11-23T15:00:00Z`, `allDay: true` | 사업/회차 운영 기간. 교육 진행 예정일 아님 |
| form-bindings 장식 | `runtimeInputMode: "fixed_schedule_options"`. items 라벨 `26년 10월 4일(일) 00:00 ~ 00:00` | **틀림.** 186597 종일 구간을 KST 자정으로 찍은 값 |

`2026-10-03T15:00:00Z` = Asia/Seoul `2026-10-04 00:00`. 그래서 「10월 4일 00:00 ~ 00:00」이 나온다.

`curricula`가 있어도 `schedules`는 회차 1건(운영 기간)만 있다. 커리큘럼 세션 제목으로 예정일을 만들지 마라.

---

## 1. 계약 — 공개 상세

`GET /api/portal/programs/{programId}` 에 **1차 필드**를 추가한다. 기존 키는 유지.

| 필드 | 타입 | 의미 |
|------|------|------|
| `educationScheduleMode` | `"date"` \| `"period"` | 공통정보와 동일 |
| `educationScheduleLines` | `string[]` | 공통정보 교육 진행 예정일 **표시 문자열 그대로**. 순서 유지 |

소스(우선순위, **위에서 끝나면 아래를 보지 말 것**):

1. Admin persist된 `generalCommonInfo.educationScheduleLines` / `educationScheduleMode`  
2. 없으면 동일 의미 nested `program.generalCommonInfo.*`  
3. 둘 다 없으면 `[]` 와 mode 생략 또는 `null`. **빈 배열을 회차 기간으로 채우지 말 것**

하면 안 되는 일:

1. `schedules[]` / `rounds[]` / `businessStartDate`~`businessEndDate` / `recruitments[].operationStartDate` 로 `educationScheduleLines`를 만들기  
2. all-day instant를 `00:00 ~ 00:00` 라벨로 만들어 넣기  
3. 게시 양식 시드(4월 등)로 채우기  
4. `serviceDetailJson` 통째를 Portal 응답에 실어 FE가 파싱하게 하기  
5. overlay 키 `generalRegistration.educationScheduleSettings.scheduleLines`만 내려주고 1차 필드는 빼기 — overlay는 admin 내부. Portal 계약은 위 두 필드

Platform 프로그램 상세 **세부내용** 「교육 일정 1」「교육 일정 2」카드도 **같은 배열**이다. 줄마다 `교육 일정 N` + 문자열. 신청 선택지와 다른 소스를 쓰지 말 것.

`186021` GET 필수 값:

```json
{
  "educationScheduleMode": "date",
  "educationScheduleLines": [
    "26년 10월 13일(화) 10:00 ~ 12:00",
    "26년 10월 20일(화) 13:30 ~ 16:00"
  ]
}
```

문자열이 CMS 공통정보와 **한 글자도 다르면 실패**다.

---

## 2. 계약 — form-bindings 장식

`GET /api/portal/programs/{programId}/form-bindings/{bindingId}` 가 진행 희망 교육 일정 단락(`multiple_choice`, 개인 `program-participant-application-seed-schedule` / 기관 scheduleChoice)을 `runtimeInputMode: "fixed_schedule_options"` 로 장식할 때:

- `items[].label` 과 `runtimeContext.scheduleOptions` 라벨 = **§1과 같은 `educationScheduleLines`**
- `educationScheduleMode === "date"` 이고 줄이 2개 이상이면 체크박스 선택지로 그 줄을 쓴다
- 줄이 없으면 items를 회차 기간으로 덮지 말 것. 시드 items를 유지하거나 단락을 숨기는 **기존 정책**만. **새 가짜 라벨 금지**

하면 안 되는 일:

1. `scheduleId` 186597 / round `startDate`~`endDate` 로 선택지 1줄을 만들기  
2. UTC instant → `26년 N월 N일(요일) 00:00 ~ 00:00` 포맷  
3. 개인 신청에 기관 1·2지망(기간 지정 UI)용 빈 items + preferred overlay를 **날짜 지정 프로그램에** 붙이기. `mode === "period"` 일 때만 기간 지정 규칙을 적용

`186021` form-bindings 필수:

- items 라벨이 `26년 10월 13일(화) 10:00 ~ 12:00`, `26년 10월 20일(화) 13:30 ~ 16:00`
- `26년 10월 4일(일) 00:00 ~ 00:00` **없음**
- `26년 4월 20일` / `26년 4월 27일` 시드 **없음** (장식 후)

---

## 3. 검수

- [ ] `GET /api/portal/programs/186021` 에 §1 JSON과 같은 `educationScheduleLines` · `educationScheduleMode`  
- [ ] 같은 GET에 `serviceDetailJson`을 새로 넣지 않았거나, 넣었더라도 FE 필수 필드가 아님 (1차 필드가 있음)  
- [ ] `schedules[0]`(186597)은 그대로여도 됨. 그 값으로 lines를 만들지 말 것  
- [ ] form-bindings 일정 단락 items = 위 두 줄  
- [ ] 공통정보 줄이 없는 프로그램: lines `[]`, form-bindings가 회차 `00:00 ~ 00:00`을 **새로 만들지 않음**  
- [ ] `GENERAL_ORGANIZATION` 날짜 지정 프로그램 1건도 동일 규칙  

---

## 4. 회신

1. Portal 상세에 `educationScheduleLines` / `educationScheduleMode`를 추가했는지  
2. form-bindings `fixed_schedule_options` 소스를 공통정보 줄로 바꿨는지  
3. `186021` GET + form-bindings 실측 JSON (일정 단락 items만)  
