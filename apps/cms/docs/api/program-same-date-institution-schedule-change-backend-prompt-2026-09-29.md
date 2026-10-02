# Cursor prompt — 같은 날짜 기관 교육 일정 일괄 변경 (JABACK)

범위는 `program-same-date-institution-schedule-change-all-types-backend-request-2026-10-02.md` 로 넓어졌다. 일반만 구현하지 말고 그 문서를 따른다.
**BE 반영됨 (2026-10-02).** FE: `program-same-date-institution-schedule-frontend-handoff-2026-10-02.md`.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 탐색하지 말고, **이 문서의 계약만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-same-date-institution-schedule-change-backend-prompt-2026-09-29.md`

대상은 CMS 관리자 API다. 홈페이지 어드민(`JAHOMEADMINBACK`, `localhost:8081`)이 아니다.

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **관리자 Bearer**.
로그인 `POST /api/admin/auth/login` `{ "email": "admin1@jakorea.org", "password": "test1234!" }` 다음 `POST /api/admin/auth/mfa/verify` `{ "challengeUuid", "verificationCode": "000000" }`.

현재 OpenAPI(dashboard subset)에는 일반 프로그램의 **같은 날짜 참여 기관 일정 일괄 변경** API가 없다.
있는 것은 UJAT 신청 1건용 `POST /api/admin/programs/{programId}/ujat/organization-applications/{applicationId}/schedule-change-request` 뿐이다.
프론트는 기관마다 PATCH를 반복하지 않는다. 이 API가 생기기 전에는 공통정보 팝업이 프로그램 일정 줄만 로컬로 바꾸고, 기관 일정은 저장하지 않는다.

---

## Goal

공통정보 「일정 변경」에서 고른 기존 날짜를, 그 날짜에 교육이 예정된 **모든 참여 기관**의 일정으로 한 번에 옮긴다.

요청 예:

```json
{
  "fromDate": "2026-04-20",
  "toDate": "2026-05-01"
}
```

- `fromDate`·`toDate`는 `YYYY-MM-DD`, Asia/Seoul 달력일.
- 같은 프로그램에서 `fromDate`에 시작하는 참여 기관 교육 일정만 `toDate`로 옮긴다. 시각이 있으면 시각은 유지한다.
- 다른 날짜, 다른 프로그램, 이미 지난 일정은 바꾸지 않는다.
- `toDate`는 그 프로그램 교육 진행 기간(`businessStartDate`~`businessEndDate`, 당일 포함) 안이어야 한다. 밖이면 400.
- 성공 후 기관 상세 일정 GET과 변경 이력이 같은 날짜를 보여야 한다.
- path·필드명은 기존 일정 리소스에 맞추고, 없는 이름을 추측해 여러 개 만들지 마라. OpenAPI에 반영하라.

프론트는 이 API가 codegen에 들어오기 전에는 호출하지 않는다.
