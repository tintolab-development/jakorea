# Cursor prompt — Platform 신청폼 `form` 문서 정합 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/participation-apply-form-document-backend-cursor-prompt-2026-09-25.md`

확인 기준: 2026-09-25 로컬 `GET http://localhost:8080/v3/api-docs` 와 무토큰 호출.

이미 있는 공개 계약은 프론트가 쓰고 있다. 이 작업은 **신청폼 응답의 `form` 모양만** 고친다. path를 새로 만들지 마라.

---

## Goal

`GET /api/portal/programs/{programId}/form-bindings/{bindingId}` 의 `form`을, CMS `form_template_version.schema_jsonb`를 파싱한 **작성 양식 문서 객체**로 내려라.  
지금 `form`은 `schemaJson` 문자열이 들어 있는 렌더 래퍼다. Platform 작성 화면은 그 래퍼를 그리지 못한다.

---

## Out of scope / 금지

- `GET /api/portal/public/program-results`, `GET /api/portal/public/program-results/{resultId}` 의 path·query·필드 변경. 이 API는 무토큰 200이다. 목록이 비어 있는 것은 데이터다. 시드는 아래 「결과 글」절의 기존 프롬프트로만 한다. 이 문서에 시드 JSON을 다시 쓰지 마라.
- `GET /api/portal/programs`, `GET /api/portal/programs/{programId}` 의 기존 필드 삭제·rename·필수화. `applicationMethod`, `interviewEnabled`, `documentPassAnnouncementAt`, `interviewStartAt`, `interviewEndAt`, `finalPassAnnouncementAt`, `term`, `scheduleKind`, `publiclyVisible` 는 이미 있다.
- `GET /api/portal/programs/{programId}/application-options` path 변경. `formBindingId`, `recruitmentId`, `applicationType` 은 이미 있다.
- `PUT /api/portal/programs/{programId}/applications/draft`, `POST /api/portal/programs/{programId}/applications` path 변경.
- `SaveApplicationRequest` required (`recruitmentId`, `applicationType`, `formBindingId`), `requestedSchedules` max 3, `preferredScheduleBlocks` max 10 변경.
- `answers` / `draftAnswers` 키 순서 변경. 순서는 `questionKey`, `fieldKey`, `key`, `name`, `id` 다.
- `form` 대신 `questions` / `sections` 배열을 작성 양식으로 쓰기.
- Platform·CMS 프론트 수정.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.

---

## 유지 (변경 금지)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/portal/programs/{programId}/application-options` | 회원 Bearer. 신청 가능한 `recruitmentId`, `applicationType`, `formBindingId` |
| GET | `/api/portal/programs/{programId}/form-bindings/{bindingId}` | query `recruitmentId`, `applicationType` 둘 다 필요. `operationId` `renderApplicationForm` |
| PUT | `/api/portal/programs/{programId}/applications/draft` | body `SaveApplicationRequest` |
| POST | `/api/portal/programs/{programId}/applications` | body `SaveApplicationRequest`. 응답 `ApplicationSaveResponse` |

임시저장이 없으면 `draftAnswers` 는 `{}` 다. 이 값을 `null` 로 바꾸지 마라.

---

## 1. `form` 을 작성 양식 문서로

`ApplicationFormResponse.form` 은 `Map` 이다. 지금은 `FormRenderService.renderVersion` 결과라 아래 모양이다.

```json
{
  "templateVersionId": 10,
  "templateCode": "application-participant-school",
  "schemaJson": "{\"schemaVersion\":1,\"paragraphs\":[...]}",
  "sections": [],
  "questions": []
}
```

`schemaJson` 은 **문자열**이다. 최상위에 `paragraphs` 가 없다. Platform `FormTemplateRenderer` 는 최상위 `paragraphs` 가 있는 작성 양식 문서만 그린다.

고친 `form` 은 `schema_jsonb` 를 파싱한 객체다. 런타임 장식(일정 선택지, 숨김 문단, `runtimeContext`)은 **지금 `schemaJson` 문자열에 다시 넣는 그 결과**를 객체로 담아라. 장식 전 원본 컬럼을 그대로 내리지 마라.

```json
{
  "programId": 186025,
  "recruitmentId": 186067,
  "applicationType": "ORGANIZATION",
  "formBindingId": 1,
  "templateVersionId": 10,
  "form": {
    "schemaVersion": 1,
    "paragraphs": [
      {
        "id": "paragraph-motivation",
        "kind": "single_item",
        "variant": "short_essay"
      }
    ]
  },
  "draftApplicationId": null,
  "draftFormResponseId": null,
  "draftAnswers": {}
}
```

규칙:

1. `form.paragraphs` 는 배열이다. 문단 `id` 는 템플릿에 저장된 id 그대로다. 문단을 요약하거나 `questions` 행으로 바꾸지 마라.
2. `form` 안에 `schemaJson` 문자열을 남기지 마라. 파싱한 객체가 `form` 이다.
3. `templateVersionId`, `templateCode` 는 `ApplicationFormResponse` 쪽에 이미 있거나 응답 메타로 둔다. 작성 양식 본문과 섞지 마라.
4. 장식이 일정 선택지를 `schemaJson` 문단에 넣고 있으면, 그 선택지가 `form.paragraphs` 안에도 있어야 한다.
5. 게시되지 않았거나 기간 밖인 버전은 지금처럼 거절한다. 비공개 양식을 빈 `paragraphs` 로 성공 응답하지 마라.

OpenAPI `ApplicationFormResponse.form` description 을 이 객체에 맞게 고쳐라. `additionalProperties` 만 두지 말고, 최소로 `paragraphs` 배열이 있다고 적어라.

---

## 2. 결과 글 (API 추가 아님)

2026-09-25 무토큰 `GET /api/portal/public/program-results?page=0&size=10&sort=LATEST` 는 200 이고 `items` 와 `categories` 가 빈 배열이다. Platform `/results` 는 이 응답을 **등록된 결과가 없습니다** 로 보여 준다. mock 으로 되돌리지 않는다.

글을 넣는 작업은 기존 프롬프트가 SSOT 다.

`apps/platform/docs/api/participation-platform-mock-db-seed-backend-cursor-prompt-2026-09-25.md`

그 문서의 path·필드·12건·`seedLabel=platform-program-results-v1` 을 바꾸지 마라. 첨부를 화면에 보이게 하려면 `originalFilename` 과 `downloadEndpoint` 를 둘 다 채워라. `downloadEndpoint` 가 없으면 Platform 은 그 파일을 그리지 않는다. 파일 바이트를 새로 만들지 말고, 기존 `GET /api/portal/public/files/{fileObjectId}/download` 를 써라. 공개 파일이 없으면 첨부 배열은 `[]` 다.

---

## 완료 조건

1. 회원 토큰으로 `GET .../form-bindings/{bindingId}?recruitmentId=&applicationType=` 를 호출하면 `form` 이 객체이고 `form.paragraphs` 가 배열이다. `form.schemaJson` 문자열은 없다.
2. 그 `paragraphs[].id` 로 `PUT` draft / `POST` submit 의 `answers` 키를 만들 수 있다. 키 순서는 그대로다.
3. 신청 네 path 의 required 와 maxItems 는 diff 에 바뀌지 않는다.
4. 결과 목록 path 는 diff 에 바뀌지 않는다. 시드를 이 작업에서 돌렸다면 `totalElements` 가 12 다. 돌리지 않았으면 답변에 「시드 미실행」이라고만 적어라.
5. 답변에 개인정보 없는 `form` 1건(문단 id 와 `kind`/`variant` 만)과 `draftAnswers` 가 `{}` 인 응답을 붙인다.
