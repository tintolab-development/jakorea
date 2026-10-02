# 일반 프로그램 설문 관리 — FE 핸드오프

작성일: 2026-10-02

대상 화면: CMS 일반 프로그램 상세 → LNB 설문 관리 (설문조사 / 만족도조사 / 강의평가).

기존 path 시그니처는 그대로다. `PATCH /api/admin/form-responses/{responseId}` 를 새로 만들지 않았다. 결과 Excel/PDF export path도 없다.

**FE 반영:** 2026-10-02. 분모는 `expectedRespondentCount`, 봉사자 등록은 `VOLUNTEER` + `TERM` + `targetScopeId` 1|2, 재제출 409는 `FORM_RESPONSE_ALREADY_SUBMITTED`. 강의평가 삭제 버튼은 만들지 않았다.

## 목록

`GET /api/admin/programs/{programId}/surveys`

`GET /api/admin/programs/{programId}/form-bindings`

- 활성 `SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION`(및 동일 계열)이 surveys에 온다.
- `REGISTRATION` / `RECRUITMENT` / `APPLICATION` 은 surveys에 오지 않는다.
- 같은 바인딩의 `bindingId` 는 두 GET이 같다. 공유·삭제는 그 숫자를 쓴다.
- 생성 때 넣은 `formType`, `targetRole`, `targetScope`, `targetScopeId` 를 GET이 유지한다. 강의평가 `SCHEDULE` + 회차 id를 `PROGRAM`으로 바꾸지 않는다.
- `submissionStartAt` / `submissionEndAt` 이 둘 다 null이면 기간이 없는 것이다. 화면 상태는 `in_progress`다. 서버가 종료 시각을 만들어 `finished`로 두지 않는다.
- `submittedCount` 는 제출 수다.

## 예상 인원

두 GET 모두 `expectedRespondentCount` (정수, 없으면 null).

| 대상 | 값 |
|------|-----|
| `STUDENT` | 활성 학생 명단 수 |
| `TEACHER` / `ORGANIZATION` / `SCHOOL` | 참여 기관 수 |
| `INDIVIDUAL` | 개인 참여자 수 |
| `INSTRUCTOR` | 강사 수 |
| `VOLUNTEER` | 봉사자 수. `targetScope=TERM` 이고 `targetScopeId` 가 1(상반기) 또는 2(하반기)면 그 반기 일정에 배정된 봉사자. 일정 이름에서 반기를 확정할 수 없으면 null |
| 그 외 | null |

null이면 설문조사 탭은 지금처럼 프로그램 총원을 쓴다. `0` 은 그 대상 인원이 0명일 때만이다. `submittedCount` 로 분모를 채우지 않는다.

## 강의평가 제출·수정

최초 제출은 기존 `POST /api/admin/form-responses/submit`.

```json
{
  "templateVersionId": 2000,
  "programId": 100,
  "contextType": "SCHEDULE",
  "contextId": 501,
  "answers": { "<paragraphId>": "선택한 값" }
}
```

`contextType=SCHEDULE` 과 회차 `contextId` 를 그 회차에 저장한다.

같은 관리자, 같은 템플릿 버전, 같은 컨텍스트로 submit을 다시 치면 **409** `FORM_RESPONSE_ALREADY_SUBMITTED`. 기존 행을 갱신하지 않는다.

수정은 기존 `PATCH /api/admin/form-responses/{responseId}`.

```json
{ "answers": { "<paragraphId>": "수정한 값" } }
```

`responseId` 는 응답 목록 `formResponseId` 다. PATCH 뒤에도 같은 id다. `answers` 만 바뀐다. `reason` 은 선택이다. 보내지 않아도 된다.

응답 목록 `answerPreviewJson` 과 상세 `answers[].questionKey` 는 submit 때 보낸 키와 같다.

## 회귀

공유 `POST …/surveys/bindings/{bindingId}/share-link`, 삭제 `DELETE …/form-bindings/{bindingId}`, 응답 목록·상세·summary path는 그대로다. 강의평가 삭제 path는 있으나 이 화면에서 버튼을 만들지 않는다.
