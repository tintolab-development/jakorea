# Cursor prompt — 같은 날짜 기관 교육 일정 일괄 변경, 전 유형 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 탐색하지 말고, **이 문서의 계약만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-same-date-institution-schedule-change-all-types-backend-request-2026-10-02.md`

`program-same-date-institution-schedule-change-backend-prompt-2026-09-29.md` 의 범위를 넓힌 문서다. 일반만 구현하고 끝내지 마라. 그 파일의 계약(하루를 하루로, 시각 유지, 기간 밖 400)은 유지하고, 대상 프로그램 유형만 이 문서를 따른다.

대상은 CMS 관리자 API다. 홈페이지 어드민(`JAHOMEADMINBACK`, `localhost:8081`)이 아니다. Gemini는 대상이 아니다.

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **관리자 Bearer**.
로그인 `POST /api/admin/auth/login` `{ "email": "admin1@jakorea.org", "password": "test1234!" }` 다음 `POST /api/admin/auth/mfa/verify` `{ "challengeUuid", "verificationCode": "000000" }`.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 프로그램 유형 | `GENERAL`, `COMPANY_SCHOOL`, `TRAINED_TEACHER`, `UJAT` |
| 제외 | Gemini |
| 프론트 | codegen 전에는 호출하지 않는다. 공통정보 팝업은 프로그램 일정 줄만 로컬로 바꾼다 |

---

## 1. 한 줄 요약

공통정보 「일정 변경」에서 고른 기존 날짜를, 그 날짜에 교육이 예정된 **모든 참여 기관** 일정으로 한 번에 옮기는 API를 **프로그램 유형과 무관하게 `programId` 하나**로 연다.

유형마다 path를 만들지 마라. 없는 이름을 여러 개 추측하지 마라. 기존 일정 리소스에 맞춘 **일괄 path 하나**만 OpenAPI에 넣어라.

있는 것은 기관 1곳용 `PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules` 와, UJAT 신청 1건용 `POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request` 뿐이다. 프론트는 기관마다 PATCH를 반복하지 않는다. UJAT 신청 1건용 path를 이 일괄 변경으로 재사용하지 마라.

---

## 2. 요청

```json
{
  "fromDate": "2026-04-20",
  "toDate": "2026-05-01"
}
```

- `fromDate`·`toDate`는 `YYYY-MM-DD`, Asia/Seoul 달력일.
- `toDate`는 그 프로그램 교육 진행 기간(`businessStartDate`~`businessEndDate`, 당일 포함) 안이어야 한다. 밖이면 400.
- 다른 날짜, 다른 프로그램, 이미 지난 일정은 바꾸지 않는다.
- 시각이 있으면 시각은 유지하고 달력일만 옮긴다.

### 2.1 일반 · 1사1교 · 교육받은 교사

`GENERAL`, `COMPANY_SCHOOL`, `TRAINED_TEACHER`.

그 프로그램에서 `fromDate`에 **시작**하는 참여 기관 교육 일정만 `toDate`로 옮긴다.
기관별 `PATCH …/participants/{participantId}/schedules` 를 프론트가 반복하게 하지 마라. 일괄 API 한 번으로 끝낸다.

### 2.2 UJAT

`UJAT`.

`GET /api/admin/programs/{programId}/ujat/organization-schedule-assignments` 슬롯 중 서울 달력일이 `fromDate`인 것만 `toDate`로 옮긴다. 슬롯의 시작 시각 필드는 `scheduleStartAt` 이다.
`POST …/ujat/organization-applications/{applicationId}/schedule-change-request` 는 신청 1건용이다. 이 일괄 변경의 구현으로 쓰지 마라.

---

## 3. 성공 후 조회

- 일반·1사1교·교육받은 교사: 참여 기관 일정 GET이 `toDate`를 보여야 한다. `fromDate`에 시작하던 그 일정은 더 이상 `fromDate`가 아니어야 한다.
- UJAT: `GET …/ujat/organization-schedule-assignments` 의 해당 슬롯 `scheduleStartAt` 달력일이 `toDate`여야 한다.
- `GET /api/admin/programs/{programId}/schedule-change-histories` 에 같은 날짜 변경이 남아야 한다.

OpenAPI에 반영하라. codegen 전에는 프론트가 호출하지 않는다.
