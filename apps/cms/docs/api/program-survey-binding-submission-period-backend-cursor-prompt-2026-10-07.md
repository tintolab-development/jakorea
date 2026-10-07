# Cursor prompt — 프로그램 설문 바인딩 작성 기간 저장 · 응답 기간 강제 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-survey-binding-submission-period-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간 (기간 전 응답 가능).**
> 양식에 「작성 기간」을 지정하고 설문을 등록해도 등록 직후부터 진행 중이 되고, 기간 전에도 응답할 수 있다.
> FE는 2026-10-07부터 등록 시 기간을 바인딩에 실어 보낸다. 이 문서는 **서버 저장·검증·강제**만 다룬다.
>
> 진행 상태(`progressStatus`) · `availableActions` · 삭제 가드는 별도 문서
> `program-survey-binding-progress-status-delete-guard-backend-cursor-prompt-2026-10-07.md`에서 다룬다. 여기서 중복 구현하지 마라.

---

## 배경과 원인

- 양식 관리의 설문 양식은 제목 단락(`variant: survey_title_with_period`)에 「작성 기간」을 둔다.
  값은 version `schemaJson` 안 `startAt` / `endAt`(ISO)에만 저장된다.
- 지금까지 CMS 등록(`POST /api/admin/programs/{programId}/form-bindings`)은 `submissionStartAt` / `submissionEndAt`을 보내지 않았다.
  → 바인딩 기간 null → 계약상 진행 중 → 바로 응답 가능.
- 재현: `programId=186051`, 설문 관리 탭. 양식 작성 기간이 미래인데 진행 중으로 표시된다.

## FE 변경 (2026-10-07, 완료)

등록 시 body에 아래를 추가한다. 일반·UJAT, `SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION` 공통.

```json
{
  "formType": "SURVEY",
  "templateId": 1995,
  "templateVersionId": 352,
  "submissionStartAt": "2026-10-20T00:00:00.000Z",
  "submissionEndAt": "2026-10-31T14:59:59.000Z",
  "active": true,
  "required": false
}
```

- 값은 바인딩할 **PUBLISHED version의 schemaJson** 제목 단락에서 읽는다(UTC ISO, `Z`).
- 「바로 시작」/「마감 없음」/활동일 상대 프리셋이면 해당 필드를 **생략**한다. 시작만, 종료만 오는 경우가 있다.
- 선택 템플릿의 최신 version이 DRAFT면 FE가 `POST /form-template-versions/{id}/publish` 후 그 version으로 바인딩한다(카탈로그 duplicate 안 함).

---

## 요청

### A. [확정] `POST form-bindings`가 기간을 저장하는지 확인·보장

- `submissionStartAt` / `submissionEndAt`을 받아 저장하고, `GET /api/admin/programs/{programId}/form-bindings` 응답에 그대로 내려주는지 확인하라.
- 이미 저장된다면 코드 변경 없이 확인 결과만 보고하라.
- `Z` / `+09:00` 오프셋이 포함된 ISO-8601을 모두 받아야 한다. 저장·응답 타임존 규칙을 보고하라.
- 검증: 둘 다 있을 때 `submissionStartAt > submissionEndAt`이면 **400** (`FORM_BINDING_INVALID_SUBMISSION_PERIOD`).
- 한쪽만 있는 경우를 허용하라(시작만 = 마감 없음, 종료만 = 바로 시작).

### B. [확정] `PATCH form-bindings/{bindingId}`로 기간만 수정 가능한지 확인

- 기존 바인딩(기간 null로 이미 등록된 설문)을 삭제 없이 보정하려 한다.
- body에 `submissionStartAt` / `submissionEndAt`만 보냈을 때 **다른 필드(templateVersionId, targetRole 등)를 null로 덮지 않는 부분 수정**인지 확인하라.
- 전체 교체(PUT 의미)라면 보고만 하고 바꾸지 마라. FE가 전체 필드를 채워 보내는 방식으로 맞춘다.
- 기간을 지우는 방법(명시적 null 허용 여부)을 보고하라.

### C. [확정] 응답 제출 시 바인딩 기간 강제

설문류 바인딩(`SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION`)에 응답을 제출하는 모든 서버 경로에서:

- `submissionStartAt != null && now < submissionStartAt` → **409** `FORM_SUBMISSION_NOT_STARTED`, 메시지 「아직 설문 작성 기간이 아닙니다.」
- `submissionEndAt != null && now > submissionEndAt` → **409** `FORM_SUBMISSION_CLOSED`, 메시지 「설문 작성 기간이 종료되었습니다.」
- 둘 다 null이면 현행대로 허용한다.
- 대상 경로를 먼저 나열하라: Platform 회원 제출, 공유 링크(shareToken) 제출, 관리자 대리 제출(`POST /api/admin/form-responses/submit`).
  - **관리자 대리 제출은 기간 강제에서 제외**할지 판단 근거와 함께 보고하라(기본 제안: 제외).
- 이미 같은 검사가 있으면 에러 코드·메시지만 맞추고 위치를 보고하라.

### D. [확정] Platform 목록·상세 응답에 기간 노출

- `PortalFormListItem`에 `submissionStartAt` / `submissionEndAt`이 이미 있다. 바인딩 값이 그대로 채워지는지 확인하라.
- 설문 상세(작성 화면 진입) 응답에도 같은 두 필드를 내려 Platform이 기간 전 진입 시 안내할 수 있게 하라(없으면 additive 추가).

### E. [확인만] 이번 FE 흐름이 기대는 version 동작

코드 변경 없이 현재 동작을 보고하라.

1. PUBLISHED version에 `PUT /form-template-versions/{id}` → **409 `FORM_VERSION_IMMUTABLE`** 인가? (에러 코드 위치: `error.code` 또는 최상위 `code`)
2. `POST /form-templates/{templateId}/versions/copy` body `{ sourceVersionId }`만 보내면 **같은 템플릿에 DRAFT version**이 생기고 `templateVersionId` / `versionNo`를 응답하는가? 템플릿 목록(`GET /form-templates`) 행 수는 늘지 않는가?
3. 템플릿 목록의 `latestVersionId`는 versionNo 최대 version인가, 최신 DRAFT인가?
4. 이미 바인딩된 PUBLISHED version은 템플릿에 새 version이 생겨도 바인딩이 그 version에 고정되는가?

---

## 하지 말 것

- 기간이 null인 바인딩에 서버가 schemaJson을 읽어 기간을 **자동으로 채우지 마라**(FE가 등록 시 명시적으로 보낸다).
- 기존 null 바인딩 데이터를 마이그레이션으로 바꾸지 마라.
- 설문류가 아닌 form-binding(신청서·동의서 등)의 제출 기간 동작을 바꾸지 마라.
- `progressStatus` / 삭제 가드는 이 문서에서 구현하지 마라(별도 문서).
- 기존 응답 필드 이름·의미를 바꾸지 마라. 추가만 한다.

---

## 완료 보고 형식

1. A: 기간 저장 여부, 타임존 규칙, 검증 추가 여부 (변경 파일)
2. B: PATCH 부분 수정 여부, null 처리
3. C: 제출 경로 목록 + 각 경로 기간 강제 결과, 관리자 대리 제출 판단
4. D: Platform 목록·상세 기간 필드 상태
5. E: 4개 항목 현재 동작
6. OpenAPI 변경점 (400·409 에러 코드, 추가 필드)
7. 재현 확인
   - 시작일시 미래 바인딩 생성 → GET에 기간 그대로, Platform 제출 → 409 `FORM_SUBMISSION_NOT_STARTED`
   - 종료일시 과거 바인딩 → 제출 409 `FORM_SUBMISSION_CLOSED`
   - 기간 null 바인딩 → 제출 허용(현행)
   - 시작 > 종료 생성 → 400

---

## FE 후속 (참고 · 백엔드 작업 아님)

- B 결과에 따라 CMS 설문 관리에 기존 설문 「작성 기간」 보정(PATCH) 동작 추가 검토.
- Platform 설문 작성 화면: 기간 전·후 진입 안내, 409 코드별 메시지 처리.
