# Cursor prompt — Portal 신청 양식 GET은 모집 시작 전에도 200 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/portal-apply-form-bindings-before-recruitment-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P0** |
| 화면 | Platform 프로그램 상세 → 신청하기 |
| `operationId` | `renderApplicationForm` |

관련(이 티켓에서 path·`form` 모양을 다시 바꾸지 마라):

- [participation-apply-form-document-backend-cursor-prompt-2026-09-25.md](./participation-apply-form-document-backend-cursor-prompt-2026-09-25.md) — `form.paragraphs` 작성 양식 문서
- [participation-public-api-backend-cursor-prompt-2026-09-25.md](./participation-public-api-backend-cursor-prompt-2026-09-25.md) — 신청 네 path

---

## 1. 한 줄 요약

`GET /api/portal/programs/{programId}/form-bindings/{bindingId}` 는 **모집 기간과 무관하게** 회원 Bearer 로 200 이어야 한다.

모집 전·모집 종료 거절은 **제출(POST)·임시저장(PUT)** 에만 남겨라. GET 에 `RECRUITMENT_NOT_STARTED` / `RECRUITMENT_CLOSED` 를 붙이지 마라.

---

## 2. 재현 (2026-10-02 실측)

### 2.1 일반 개인 (`INDIVIDUAL`)

프로그램 `186026`, 모집 `186079`, 바인딩 `186816`, `applicationType=INDIVIDUAL`.

```http
GET /api/portal/programs/186026/form-bindings/186816?recruitmentId=186079&applicationType=INDIVIDUAL
Authorization: Bearer <회원>
```

지금 응답:

```json
{
  "success": false,
  "data": null,
  "message": "모집이 아직 시작되지 않았습니다.",
  "error": {
    "code": "RECRUITMENT_NOT_STARTED",
    "message": "모집이 아직 시작되지 않았습니다.",
    "field": null,
    "traceId": "b42c8acc201d4b00a3227a0493b9eb95",
    "details": null
  }
}
```

HTTP 는 4xx(관측상 409) 이다.

같은 시각 `GET /api/portal/programs/186026/application-options` 는 이 모집 행을 내려준다. `formBindingId=186816`, `canApply=false`, `blockedReason=RECRUITMENT_NOT_STARTED` 이면 **맞다.** options 계약을 바꾸지 마라.

### 2.2 강사 신청 (`INSTRUCTOR`) — 모집 기간과 별개 이슈(참고)

모집이 이미 `ACTIVE` / `open:true` 여도 CMS 「강사 신청 양식」 수정이 Platform에 안 보일 수 있다.

원인(프론트): CMS 신청 정보 탭이 `activeRecruitmentId` 없이 프로그램 단위 바인딩을 읽고·저장하면, Portal `application-options` 가 쓰는 **모집 행(`targetScope=RECRUITMENT`) 바인딩**과 어긋난다. 예: 강사 모집 `186080` 이 열려 있어도 CMS가 다른(또는 catalog) version을 고친다.

이건 **GET form-bindings 모집 시작 전 409와 별개**다. FE는 신청 양식 미리보기·수정에 강사/봉사자/참여자 모집 행 id를 맞춘다. 본 티켓의 BE 작업은 여전히 §1 GET 200이다.

재현(모집 시작 전 409 — §2.1 과 동일 계약):

1. CMS 일반(또는 강사 모집이 있는) 프로그램 → 신청 정보 → **강사 신청 정보** 탭에서 제3자 동의 「제공받는 곳」 등을 수정 후 저장
2. Platform 강사 프로그램 상세 → 신청하기 (`applicationType=INSTRUCTOR` · 해당 `formBindingId`)
3. 모집 시작 전이면 GET form-bindings 가 409 → 커스텀본 미노출

기대: 모집 전이어도 GET 200 + CMS에 저장한 강사 신청 발행본(시드 원본 아님).

Platform 신청하기는 모집 전이어도 이 GET 을 호출한다. 409 이면 CMS 등록본을 그리지 못한다.

---

## 3. 계약

이미 있는 path 만 쓴다. path·query·required 를 추가하거나 바꾸지 마라.

| Method | Path | 모집 시작 전 | 모집 중 | 모집 종료 후 |
|--------|------|-------------|--------|-------------|
| GET | `/api/portal/programs/{programId}/application-options` | 200. 해당 옵션 `canApply=false`, `blockedReason=RECRUITMENT_NOT_STARTED`. `formBindingId` 유지 | 기간이 열린 옵션은 `canApply=true`(자격 거절은 기존 코드) | 해당 옵션 `canApply=false`, `blockedReason=RECRUITMENT_CLOSED`. `formBindingId` 유지 |
| GET | `/api/portal/programs/{programId}/form-bindings/{bindingId}` | **200 + CMS 발행 신청 양식** | 200 + 같은 문서 | **200 + 같은 문서** |
| PUT | `/api/portal/programs/{programId}/applications/draft` | `RECRUITMENT_NOT_STARTED` 거절 | 기존대로 허용 | `RECRUITMENT_CLOSED` 거절 |
| POST | `/api/portal/programs/{programId}/applications` | `RECRUITMENT_NOT_STARTED` 거절 | 기존대로 허용 | `RECRUITMENT_CLOSED` 거절 |

GET form-bindings query 는 지금과 같다. `recruitmentId`, `applicationType` 둘 다 필요.

`renderApplicationForm`(또는 동등 서비스)에서 모집 window 를 검사해 4xx 를 던지는 분기를 **제거**하라.  
그 검사를 `SaveApplication` / draft PUT 에만 남겨라.

---

## 4. 200 본문 (GET form-bindings)

성공 envelope 은 기존과 같다. `data` 가 `ApplicationFormResponse` 다.

```json
{
  "success": true,
  "data": {
    "programId": 186026,
    "recruitmentId": 186079,
    "applicationType": "INDIVIDUAL",
    "formBindingId": 186816,
    "templateVersionId": 123,
    "form": {
      "schemaVersion": 1,
      "paragraphs": []
    },
    "draftApplicationId": null,
    "draftFormResponseId": null,
    "draftAnswers": {}
  }
}
```

규칙:

1. HTTP 200. `error.code` 가 `RECRUITMENT_NOT_STARTED` / `RECRUITMENT_CLOSED` 이면 안 된다.
2. `form` 은 객체이고 `form.paragraphs` 는 배열이다. `form.schemaJson` 문자열은 없다.  
   ([participation-apply-form-document-backend-cursor-prompt-2026-09-25.md](./participation-apply-form-document-backend-cursor-prompt-2026-09-25.md) 와 동일)
3. `form` 은 이 `formBindingId` 가 가리키는 **프로그램 전용 PUBLISHED `templateVersionId`** 이다.  
   카탈로그 시드(`application-participant-individual` · `application-instructor` 원본 등)로 바꾸지 마라.  
   CMS 신청 양식 상세조회(강사 탭 포함)와 같은 버전이어야 한다.  
   강사면 CMS에서 수정한 「제공받는 곳」·추가 단락이 `form.paragraphs` 에 그대로 있어야 한다.
4. 임시저장이 없으면 `draftAnswers` 는 `{}` 다. `null` 로 바꾸지 마라.
5. 모집 전이라고 빈 `paragraphs` 로 성공시키지 마라. 비공개·미발행·바인딩 없음만 기존처럼 거절한다.

GET 이 기존처럼 거절해도 되는 경우(이번 티켓에서 바꾸지 마라):

| 상황 | 코드 (기존 유지) |
|------|------------------|
| 비회원 / 토큰 없음 | 기존 401/403 |
| 프로그램·바인딩·모집 없음, 또는 서로 안 맞음 | 기존 404 / `RECRUITMENT_NOT_FOUND` / `RECRUITMENT_FORM_BINDING_MISMATCH` |
| 발행된 APPLICATION 버전이 없음 | 기존 4xx (양식 미구성). 시드 빈 문서로 200 하지 마라 |

모집 window 만 GET 거절 이유에서 빼라.

---

## 5. 제출은 그대로 막는다

모집 시작 전 회원 토큰으로:

```http
POST /api/portal/programs/186026/applications
```

```http
PUT /api/portal/programs/186026/applications/draft
```

둘 다 거절. `error.code` 는 `RECRUITMENT_NOT_STARTED`. 메시지 한글은 지금처럼 「모집이 아직 시작되지 않았습니다.」 를 유지해도 된다.

모집 종료 후면 같은 path 에 `RECRUITMENT_CLOSED`.

`canApply=false` 인 options 행으로 GET 양식은 되고, 제출만 안 되면 된다.

---

## 6. 적용 범위

모든 `programType` · 모든 `applicationType` (`INDIVIDUAL` / `ORGANIZATION` / `INSTRUCTOR` / `VOLUNTEER` 등).  
일반·1사1교·UJAT·Gemini·교육받은 교사 신청 GET 을 한 분기에서 막지 마라.

`186026` 한 건만 예외 처리하지 마라.

---

## 7. Out of scope / 금지

- Platform·CMS 프론트 수정
- 신청 네 path 의 path·query·required 변경
- `SaveApplicationRequest` required 변경
- `application-options` 의 `canApply` / `blockedReason` 의미 변경
- GET 성공 시 `canApply` 를 true 로 올리거나, 제출을 모집 전에 허용
- `form` 을 `questions` / `sections` 로 바꾸기
- TRUNCATE. prod Flyway 에 운영 카피 넣지 말 것

---

## 8. 완료 조건

1. 회원 토큰으로 위 `186026` GET(또는 로컬에서 모집 시작 전인 동일 조건 프로그램)이 **200** 이다.  
   `error.code` 가 `RECRUITMENT_NOT_STARTED` 가 아니다.
2. `data.form.paragraphs` 가 배열이고, CMS 해당 프로그램 신청 양식 상세의 발행 버전과 문단 id·「제공받는 곳」 등 셀 값이 같다. 카탈로그 시드가 아니다.
3. 같은 회원이 모집 시작 전 POST `/applications` · PUT `/applications/draft` 하면 여전히 `RECRUITMENT_NOT_STARTED` 다.
4. `GET .../application-options` 는 모집 전 `canApply=false` + `blockedReason=RECRUITMENT_NOT_STARTED` + `formBindingId` 유지.
5. 모집 기간이 열린 프로그램의 GET/POST 는 회귀 없다.
6. 답변에 개인정보 없는 GET 200 본문 1건(문단 id 와 `kind`/`variant` 만)과, 같은 토큰의 POST 거절 `error.code` 를 붙여라.

OpenAPI `renderApplicationForm` description 에 「모집 기간과 무관하게 발행 양식을 반환. 제출 가능 여부는 application-options.`canApply` / 신청 POST」 를 한 줄 넣어라.
