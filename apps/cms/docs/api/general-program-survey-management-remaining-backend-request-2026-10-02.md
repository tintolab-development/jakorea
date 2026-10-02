# Cursor prompt — 일반 프로그램 설문 관리 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-program-survey-management-remaining-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 갱신 | 2026-10-02 — BE 핸드오프 반영. FE는 `expectedRespondentCount` · 409 `FORM_RESPONSE_ALREADY_SUBMITTED` · 봉사자 `TERM` 을 붙였다 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (A·B) / **P2** (C) — **FE 반영 완료. 이 티켓을 다시 열지 마라** |
| 화면 | CMS 일반 프로그램 상세 → LNB **설문 관리** (설문조사 / 만족도조사 / 강의평가) |
| 대상 path | `programs/{id}/surveys`, `programs/{id}/form-bindings`, `form-responses`. UJAT·1사1교·Gemini 전용 path 아님 |

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 개인 진행현황·과제: `general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`
- 신청 목록 알림 시점: `general-organization-application-decision-notify-timing-backend-request-2026-10-02.md`
- 진행 현황 참여 기관·강사: `general-program-progress-remaining-backend-request-2026-10-02.md`
- 구 설문 갭(일부 시효): `general-individual-progress-survey-remote-gaps-backend-request-2026-09-17.md`

**시효:** 09-17 문서 §E 「강의평가 응답 수정 = submit만, PATCH 없음」은 **더 이상 사실이 아니다.**  
`PATCH /api/admin/form-responses/{responseId}` 는 OpenAPI에 있고 CMS가 이미 붙였다. 이 티켓에서 PATCH를 신설하지 마라.

---

## 0. FE가 이미 붙인 것 — 시그니처를 깨지 마라

`programs` 모듈 + 관리자 JWT 가 켜진 일반 프로그램에서 CMS가 호출한다. **이 티켓에서 바꾸지 마라.**

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 설문 목록 | `GET /api/admin/programs/{programId}/surveys` | `ProgramSurveyResponse` |
| 바인딩 목록 | `GET /api/admin/programs/{programId}/form-bindings` | 만족도·강의평가 분류 |
| 응답 목록 | `GET …/surveys/{templateVersionId}/responses` | `formResponseId` + `answerPreviewJson` |
| 응답 상세 | `GET …/surveys/{templateVersionId}/responses/{formResponseId}` | preview 비면 호출 |
| 응답 수 요약 | `GET …/surveys/{templateVersionId}/summary` | 설문조사 탭 |
| 등록 | 템플릿 복제 후 `POST …/form-bindings` | 강의평가는 `targetScope=SCHEDULE` + 첫 회차 `targetScopeId` |
| 삭제 (시작 전 설문·만족도) | `DELETE …/form-bindings/{bindingId}` | |
| 공유 (설문·만족도) | `POST …/surveys/bindings/{bindingId}/share-link` | FE는 `formPath` / `submitPath` / `shareToken` 순으로 클립보드 |
| 강의평가 최초 제출 | `POST /api/admin/form-responses/submit` | 바인딩 또는 surveys GET 의 `targetScope=SCHEDULE` 이면 `contextType=SCHEDULE` |
| 강의평가 응답 수정 | `PATCH /api/admin/form-responses/{responseId}` | **FE가 붙임.** `submit` 재호출로 대체하지 마라. body `{ answers }` |
| 강의평가 응답 삭제 | `DELETE /api/admin/form-responses/{responseId}` | path 있음. **화면에 삭제 버튼 없음** — 이 티켓에서 신설·강제하지 마라 |
| 양식 보기·수정 (시작 전) | form-templates 버전 draft | 설문 전용 path 아님 |
| 결과 다운로드 | 클라이언트 Excel/PDF | 전용 export path를 이 티켓에서 만들지 마라 |

강의평가 「응답 수정」은 서버 신규 path가 아니다. 이미 있는 PATCH 를 FE가 쓴다.

---

## 1. 한 줄 요약

설문 관리 버튼은 열린 path로 붙였다.  
남은 서버 일은 **목록/바인딩/응답 필드를 비우지 않는 것**, **강의평가 submit·PATCH 키 유지**, **만족도 대상별 예상 응답 인원**이다.

---

## A. surveys · form-bindings · responses 필드 채움 — P1

### A.1 지금

스키마에 이미 있는 필드다. CMS는 값이 있으면 쓰고, 없으면 공유/삭제/상태 배지/수정이 깨진다.

`GET /api/admin/programs/{programId}/surveys` (`ProgramSurveyResponse`):

- `bindingId` — 공유·삭제. 없으면 FE는 불가 안내만 한다. bindings GET 과 같은 숫자여야 한다.
- `templateId`, `templateVersionId` — 응답 GET 키.
- `templateName` — 탭 분류 폴백(「강의평가」「만족도」).
- `responseCount` / `submittedCount`
- `targetScope`, `targetScopeId` — 강의평가 회차. 바인딩 GET 이 비면 FE가 여기로 submit context 를 메운다.

`GET /api/admin/programs/{programId}/form-bindings` (`ProgramFormBindingResponse`):

- `bindingId`, `formType` (`SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION`)
- `targetRole` — 만족도 교사/학생/개인/봉사자 상·하반기. 비면 대상 탭이 비거나 잘못된 탭에 붙는다.
- `targetScope`, `targetScopeId` — 강의평가 등록 시 FE가 `SCHEDULE` + 회차 id 를 넣는다. **GET에 그대로 돌려라.**
- `submissionStartAt`, `submissionEndAt` — 화면 상태 `before_start` / `in_progress` / `finished` 의 유일한 근거.
- `submittedCount`
- `active`

`GET …/surveys/{templateVersionId}/responses` (`SurveyResponseListItemResponse`):

- `formResponseId` — 강의평가 PATCH 키. FE는 `respondentId` 로 숫자 id 를 보존한다.
- `answerPreviewJson` — 비면 행마다 detail GET.
- `submittedByMemberName` / `submittedByAdminName`

`GET …/responses/{formResponseId}`:

- `formResponseId`, `answers[].questionKey` / `answerDisplayText`

### A.2 해야 할 일

데이터가 있으면 위 필드를 **빈 값으로 두지 마라.**

규칙:

1. 활성 설문 바인딩 행의 `bindingId` 는 surveys GET 과 form-bindings GET 에 같은 숫자로 내려라.
2. 생성 때 받은 `formType` 을 GET 에 유지하라. `SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION` 을 섞지 마라. 운영 슬롯(`REGISTRATION` / `RECRUITMENT` / `APPLICATION` 등)을 설문 목록에 넣지 마라.
3. 만족도 생성 때 받은 `targetRole` 을 GET 에 유지하라. 대상 탭 분류의 1순위다.
4. 강의평가 생성 때 받은 `targetScope` / `targetScopeId` 를 **surveys GET 과 form-bindings GET 둘 다**에 유지하라. 프로그램 단위(`PROGRAM`)로 바꿔 버리지 마라.
5. `submissionStartAt` / `submissionEndAt` 이 없으면 FE는 상태를 `in_progress` 로 본다.  
   기간을 쓰는 상품이면 생성 시 기본 기간을 채우거나, 기간 없음이면 OpenAPI에 “기간 없음 = 진행 중”이라고 밝혀라. **가짜 finished 를 만들지 마라.**
6. 강의평가 응답 목록 각 행의 `formResponseId` 를 채워라. 수정 PATCH 키가 이 값이다. null 이면 FE는 PATCH 를 못 치고 submit 을 다시 친다.
7. `answers` / `answerPreviewJson` 의 키는 **submit 때 받은 키를 유지**하라. 내부 `questionId` 로 바꿔 내려주면 수정 화면 hydrate 가 빈다.
8. 기존 GET 시그니처를 바꾸지 마라. 필드만 채워라.

---

## B. 강의평가 submit 컨텍스트 · PATCH 키 — P1

### B.1 지금

등록: `POST …/form-bindings` + `formType=LECTURE_EVALUATION`, `targetScope=SCHEDULE`, `targetScopeId=<첫 회차>`.

제출: `POST /api/admin/form-responses/submit`

```json
{
  "templateVersionId": 2000,
  "programId": 100,
  "contextType": "SCHEDULE",
  "contextId": 501,
  "answers": { "<paragraphId>": "선택한 값" }
}
```

바인딩 GET 또는 surveys GET 의 `targetScope` 가 `SCHEDULE` 이면 FE는 위처럼 보낸다. 둘 다 없으면 `PROGRAM`.

수정: `PATCH /api/admin/form-responses/{responseId}`

```json
{ "answers": { "<paragraphId>": "수정한 값" } }
```

`responseId` 는 응답 목록 `formResponseId` 다.

### B.2 해야 할 일

1. `submit` 이 `contextType=SCHEDULE` + 회차 `contextId` 를 받으면 그 회차에 저장하라. `PROGRAM` only 로 거부하지 마라.
2. 같은 관리자·같은 템플릿 버전·같은 컨텍스트에 `submit` 을 한 번 더 치면 **409** (또는 기존 행을 갱신하지 말고 거절). 수정은 PATCH 만.
3. PATCH 는 기존 행의 `answers` 만 갱신. 새 `formResponseId` 를 만들지 마라. 응답 본문의 `formResponseId` 는 처음과 같아야 한다.
4. submit / PATCH `answers` 키를 GET 상세·목록 preview 에 그대로 돌려라.
5. `submit` / PATCH 시그니처를 이 티켓에서 바꾸지 마라. `reason` 은 optional 이다. FE는 안 보낸다. 필수로 올리지 마라.

---

## C. 만족도·설문 결과 「프로그램 참여 N명」 — P2

결과 화면은 `responseCount` 와 **예상 참여 인원**을 같이 보여 준다.

지금 surveys / bindings 에는 `submittedCount` 만 있다. FE는 설문조사 탭에서 프로그램 `totalParticipants` 로 메운다.  
만족도 대상(교사 / 학생 / 개인 / 봉사자 상·하반기)은 인원이 다르다. **대상별 예상 인원 필드가 없다.**

해야 할 일:

- surveys GET 또는 form-bindings GET 에 대상별 예상 응답 인원을 내려라. 새 도메인을 만들지 마라.
- 권장 필드명: `expectedRespondentCount` (정수). 없으면 FE는 프로그램 총원 또는 `submittedCount` 에 의존한다.
- `submittedCount` 를 예상 인원으로 꾸미지 마라. 응답 수와 분모가 같아진다.

이 필드 없이 상품이 “응답 수효만 보여 주면 된다”면 회신에 그렇게 적어라. **200 으로 0을 참여 인원인 척하지 마라.**

---

## 4. 하지 말 것

- `PATCH /api/admin/form-responses/{id}` 를 없애거나 `submit` 재호출을 수정으로 강제하기
- 결과 Excel/PDF 전용 export path 신설
- 강의평가 공유·삭제 버튼을 위한 새 path (공유 UI 없음, 삭제 path 는 이미 있음)
- 설문/만족도 관리자 응답 수정 path (그 탭은 공유 링크 응답)
- form-bindings PATCH 시그니처 변경 (기간 편집 UI 없음). 기간을 채울 거면 **생성 시** `submissionStartAt` / `submissionEndAt` 을 넣어라
- UJAT / 1사1교 / Gemini 전용 path 로 일반화
- FE mock 시드를 BE가 넣으라고 하기
- 09-17 문서대로 PATCH 를 새로 설계하기

---

## 5. Done when

1. 활성 설문의 surveys GET 에 `bindingId` 가 있고, 그 값으로 share-link / delete 가 동작한다.
2. 강의평가 바인딩 GET 과 surveys GET 에 생성 때와 같은 `targetScope` / `targetScopeId` 가 있다.
3. 만족도 바인딩 GET 에 생성 때와 같은 `formType=SATISFACTION` + `targetRole` 이 있다.
4. 강의평가 응답 목록 행에 `formResponseId` 가 있고, 그 id 로 PATCH 하면 같은 행의 answers 만 바뀐다. 두 번째 `submit` 은 409 이거나 거절.
5. GET answers / preview 키가 submit 키와 같다.
6. `submissionStartAt` / `submissionEndAt` 정책이 OpenAPI 또는 회신에 있다.
7. (P2) 대상별 예상 인원을 내려 주기로 했으면 필드가 OpenAPI에 있다. 아니면 “총원만 사용”이라고 회신에 있다.

**Last updated:** 2026-10-02
