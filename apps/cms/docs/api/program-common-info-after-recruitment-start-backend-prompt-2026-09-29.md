# Cursor prompt — 모집 시작 후 공통정보 PATCH (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-common-info-after-recruitment-start-backend-prompt-2026-09-29.md`

대상은 CMS 관리자 API다. 홈페이지 어드민(`JAHOMEADMINBACK`, `localhost:8081`)이 아니다.

확인 기준: 로컬 `GET http://localhost:8080/v3/api-docs` 와 **관리자 Bearer**.  
로그인 `POST /api/admin/auth/login` `{ "email": "admin1@jakorea.org", "password": "test1234!" }` 다음 `POST /api/admin/auth/mfa/verify` `{ "challengeUuid", "verificationCode": "000000" }`.  
저장 직후 **같은 id GET** 으로만 통과를 판단하라.

path·필드명·enum을 새로 만들지 마라. Gemini 공통정보 API는 없다.

| Method | Path |
|--------|------|
| PATCH | `/api/admin/programs/{programId}` |
| GET | `/api/admin/programs/{programId}` |

---

## Goal

모집이 이미 시작된 일반 프로그램도 **사업 운영 기간 종료 전**에는 공통정보를 저장할 수 있어야 한다.

프론트 공통정보 저장은 이제 모집 창을 보내지 않는다. 요청에 없는 모집 필드를 수정으로 보고 `409 PROGRAM_*_RECRUITMENT_EDIT_PERIOD_ENDED` 를 내지 마라.

기획:

- 공통 정보: 사업 종료일(`businessEndDate`) 당일까지 수정. 다음 날부터 `PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`.
- 참여자 유형: 등록 후 수정 불가. 요청이 `applicationTargetMode` 를 바꾸면 `PROGRAM_PARTICIPANT_TYPE_IMMUTABLE`.
- 모집 정보: 참여자 유형별 `recruitments[].operationStartDate` 당일(Asia/Seoul)부터 그 유형만 수정 불가. 값이 없으면 잠그지 말고 `startAt`으로 대체하지 마라.
- 신청 양식·폼 바인딩: 참여자 유형별 `recruitments[].startAt` 분부터 그 유형만 수정 불가.

---

## 재현

오늘 CMS에서 모집이 2026-09-25에 시작된 일반 프로그램(사업 종료 2026-12-05, 진행 현황 `프로그램 진행 예정`)의 공통정보 저장이 `409` 다.  
응답 코드는 `PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED` 또는 `PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED` / `PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED` 다.  
화면 문구는 `모집 시작 이후에는 모집·신청 정보를 수정할 수 없습니다.`

원인은 공통정보 PATCH의 `serviceDetailJson` 에 기존 모집 시작·종료, 결과 발표, 면접 여부, `participantRecruitmentInfo` 가 같이 실리고, 서버가 그 존재를 모집 수정으로 본 것이다.  
프론트는 공통정보 저장에서 그 키를 빼도록 고쳤다. 서버는 아래 요청을 받아야 한다.

대상은 **모집 `startAt` 이 이미 지났고 `businessEndDate` 가 오늘(서울) 이후**인 일반 프로그램이다. 시드에 그런 행이 있으면 그 id를 쓴다. 없으면 모집 시작을 과거, 사업 종료를 `2026-12-05` 로 둔 일반 프로그램을 하나 만들고, 검수 후 그 행만 삭제한다. `168001`~`168008`, `170001`, `182103` 은 지우지 마라.

```http
PATCH /api/admin/programs/{id}
{
  "title": "공통정보만 수정",
  "mainTitle": "공통정보만 수정",
  "startDate": "2026-11-05",
  "endDate": "2026-12-05",
  "businessStartDate": "2026-11-05",
  "businessEndDate": "2026-12-05",
  "serviceDetailJson": "{\"schemaVersion\":1,\"generalCommonInfo\":{\"announcementTitle\":\"수정된 공고\"}}"
}
```

이 바디에 없는 것:

- `recruitments`
- `applicationStartDate` / `applicationEndDate`
- `applicationTargetMode`
- `schedules` / `formBindings`
- `serviceDetailJson` 안의 `instructorApplicationStartDate`, `instructorApplicationEndDate`, `volunteerApplicationStartDate`, `volunteerApplicationEndDate`, `resultAnnouncementDate`, `resultAnnouncementMethod`, `studentListRequired`, `generalParticipantInterviewEnabled`, `generalVolunteerInterviewEnabled`, `participantRecruitmentInfo`, `instructorRecruitmentInfo`, `volunteerRecruitmentInfo`

해야 할 것:

- `200`. 공통정보(`title`, `mainTitle`, `businessStartDate`, `businessEndDate`, `generalCommonInfo.announcementTitle`)는 요청 값으로 저장된다.
- `PROGRAM_*_RECRUITMENT_EDIT_PERIOD_ENDED` 를 내지 마라.
- `GENERAL_PROGRAM_ACTIVE_PARTICIPANT_RECRUITMENT_REQUIRED` 로 이 요청을 거절하지 마라. 발행 준비 검사는 생성, 그리고 `recruitments` / `schedules` / `formBindings` 가 **이번 요청에 있을 때**만 한다.
- 요청에 없는 `serviceDetailJson` 키는 지우지 마라. GET의 모집 기간, 결과 발표, 면접 여부, `participantRecruitmentInfo` 는 PATCH 전과 같다.
- 요청에 `applicationTargetMode` 가 없으면 참여자 유형을 바꾸지 마라.
- 사업 종료일이 오늘(서울)보다 이전일 때만 `409 PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED`.

하지 말 것:

- 공통정보 저장을 통과시키려고 모집 행을 요청에 넣으라고 하지 마라.
- 모집 시작 시각이 지난 유형의 `recruitments[]` 나 `applicationStartDate` 를 **요청이 바꿀 때**의 `PROGRAM_*_RECRUITMENT_EDIT_PERIOD_ENDED` 는 유지한다.
- `applicationTargetMode` 가 기존과 다르면 `PROGRAM_PARTICIPANT_TYPE_IMMUTABLE` 을 유지한다.

---

## 검수

PATCH 직후 GET.

```http
GET /api/admin/programs/{id}
```

- `title` / `mainTitle` = `공통정보만 수정`
- `businessEndDate` 의 서울 달력 날짜 = `2026-12-05`
- `generalCommonInfo.announcementTitle` = `수정된 공고`
- 모집 `startAt` / `endAt`, 결과 발표, 면접 여부는 PATCH 전과 같다
- `applicationTargetMode` 는 PATCH 전과 같다
