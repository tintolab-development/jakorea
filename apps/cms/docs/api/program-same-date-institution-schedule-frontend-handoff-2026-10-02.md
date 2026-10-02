# 같은 날짜 참여 기관 교육 일정 일괄 변경

작성일: 2026-10-02
대상: CMS 공통정보 「일정 변경」. Gemini는 호출하지 않는다.

## 요청

`PATCH /api/admin/programs/{programId}/schedules/same-date`

권한: `ASSIGNMENT_WRITE`

```json
{ "fromDate": "2026-04-20", "toDate": "2026-05-01" }
```

`fromDate`, `toDate`는 `YYYY-MM-DD`다. 서버는 Asia/Seoul 달력일로 읽는다.

- `GENERAL`, `GENERAL_ORGANIZATION`, `COMPANY_SCHOOL`, `ONE_COMPANY_ONE_SCHOOL`, `TRAINED_TEACHER`, `UJAT`, `DGBONG`, `UJAT_DGBONG`이 이 path를 쓴다.
- Gemini는 **403** `PROGRAM_SCHEDULE_SAME_DATE_UNSUPPORTED`.
- `toDate`가 `businessStartDate`~`businessEndDate`(당일 포함) 밖이면 **400** `PROGRAM_EDUCATION_DATE_OUTSIDE_BUSINESS_PERIOD`.
- 기관별 `PATCH …/participants/{participantId}/schedules` 와 UJAT `POST …/schedule-change-request` 는 이 버튼에서 호출하지 않는다.

## 응답

```json
{
  "programId": 170002,
  "fromDate": "2026-04-20",
  "toDate": "2026-05-01",
  "changedScheduleIds": [8801]
}
```

`changedScheduleIds`는 실제로 옮긴 `program_schedule` id다. 없으면 `[]`다. `null`이 아니다.

옮기는 대상은 `fromDate`에 시작하고 아직 시각이 지나지 않은 참여 기관 교육 일정이다. 시각은 유지하고 날짜만 바뀐다. 지난 일정, 다른 날짜, 출석·정산·강의보고서·실적·강사평가가 있는 일정은 그대로다.

## 저장 후 조회

- 일반·1사1교·교육받은 교사: 참여 기관 일정은 `toDate`다.
- UJAT: `GET /api/admin/programs/{programId}/ujat/organization-schedule-assignments` 의 해당 슬롯 `scheduleStartAt` 달력일이 `toDate`다.
- `GET /api/admin/programs/{programId}/schedule-change-histories` 에 `changeType=CHANGE` 이력이 생긴다.

공통정보 팝업의 프로그램 일정 줄은 이 API 응답으로 바꾸지 않는다. 화면에서 고른 날짜를 로컬 상태에 반영한다.
