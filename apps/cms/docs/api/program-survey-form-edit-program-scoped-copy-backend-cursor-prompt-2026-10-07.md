# Cursor prompt — 프로그램 설문 양식 수정: 프로그램 전용 복제본 숨김 · 바인딩 version 교체 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-survey-form-edit-program-scoped-copy-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 중간.** CMS 「설문 양식 보기 → 양식 수정」이 프로그램마다 `… 복사본` 템플릿을 양식 관리 목록에 남긴다.
> 관련 handoff: `docs/frontend/program-survey-binding-submission-period-frontend-handoff-2026-10-07.md` §6

---

## FE 흐름 (2026-10-07 구현)

기획: 양식 수정은 **진행 전** 설문에서만 가능. 수정은 **그 프로그램 설문에만** 반영되어야 하고 양식 관리 원본·다른 프로그램은 바뀌면 안 된다.

1. 바인딩된 PUBLISHED version(`sourceVersionId`) 조회 → `templateId`
2. `POST /api/admin/form-templates/{templateId}/versions/copy` `{ sourceVersionId, versionLabel: "program-{programId}" }`  
   → 새 COPY 템플릿 + DRAFT version
3. `PUT /api/admin/form-template-versions/{copiedVersionId}` `{ schemaJson }`
4. `POST /api/admin/form-template-versions/{copiedVersionId}/publish` `{}`
5. `PATCH /api/admin/form-templates/{copiedTemplateId}` `{ description: "program-scoped:{programId}" }` (best effort)
6. `PATCH /api/admin/programs/{programId}/form-bindings/{bindingId}`  
   `{ templateId: copiedTemplateId, templateVersionId: publishedId, submissionStartAt?, submissionEndAt? }`

같은 템플릿에 새 version을 게시하지 않는 이유: handoff §6-4대로 기존 PUBLISHED가 ARCHIVED되어 다른 프로그램 설문이 Platform에서 사라진다.

## 문제

- 2단계 COPY 템플릿이 `GET /api/admin/form-templates`(설문 카테고리)에 노출된다 → 양식 관리에 「… 복사본」이 쌓이고, 다른 프로그램 설문 등록 후보에도 뜬다.
- `description` 라벨은 FE 관례일 뿐 서버가 구분하지 않는다.

---

## 요청

### A. [확정] 기존 프로그램용 프로그램 전용 복제 지원

`versions/copy` 요청에 **선택 필드 `ownerProgramId: number`** 를 추가(additive)한다.

- 지정 시 새 템플릿을 `template_scope = PROGRAM`, 소유 프로그램 = `ownerProgramId`로 저장한다.
- 기존 `ownerProgramDraftId`(등록 중 draft 귀속)와 동시에 오면 400.
- 권한: 해당 프로그램 관리 권한이 없으면 403.
- 이미 동등 기능(다른 필드명·다른 엔드포인트)이 있으면 그것을 보고하고 새로 만들지 마라.

### B. [확정] PROGRAM scope 템플릿은 카탈로그 목록에서 제외

- `GET /api/admin/form-templates` 기본 응답에서 `template_scope = PROGRAM` 행을 제외한다(설문 카테고리 포함 전 카테고리).
- 필요 시 `includeProgramScoped=true` 쿼리로만 포함한다.
- 기존 `template_scope = COPY` 행의 노출 규칙은 바꾸지 마라.

### C. [확인 후 보고] 바인딩 PATCH로 템플릿·version 교체

`PATCH /api/admin/programs/{programId}/form-bindings/{bindingId}` 에 `templateId` + `templateVersionId`를 함께 보내 **다른 템플릿의 PUBLISHED version으로 교체**할 수 있는지 보고하라.

- 불가하면 허용하라. 조건: 대상 version `PUBLISHED`, 바인딩 `formType` 불변.
- 설문류(`SURVEY` / `SATISFACTION` / `LECTURE_EVALUATION`)는 `progressStatus != BEFORE_START`이면 교체를 **409 `FORM_BINDING_TEMPLATE_LOCKED`** 로 거부한다(별도 문서 D 항목과 동일 정책). 응답이 1건이라도 있으면 상태와 무관하게 409.

### D. [확정] 교체로 버려진 프로그램 전용 템플릿 정리

- C로 교체된 뒤 이전 version이 `template_scope = PROGRAM`이고 다른 활성 바인딩이 없으면 soft delete(또는 ARCHIVED)한다.
- 카탈로그·COPY 템플릿은 건드리지 마라.

---

## 하지 말 것

- 같은 템플릿 안에서 PUBLISHED를 여러 개 허용하는 식으로 정책을 바꾸지 마라(이 문서 범위 밖).
- 양식 관리 원본(카탈로그) 템플릿 내용을 바꾸지 마라.
- 기존 응답 필드 이름·의미를 바꾸지 마라. 추가만 한다.

---

## 완료 보고 형식

1. A: 요청 필드, 저장되는 scope·소유 정보, 권한 검사 (변경 파일)
2. B: 목록 제외 조건, 쿼리 옵션
3. C: 교체 가능 여부(변경 전/후), 409 조건
4. D: 정리 시점·방식
5. OpenAPI 변경점
6. 재현 확인
   - `versions/copy` + `ownerProgramId` → 목록 행 수 불변, 새 version DRAFT
   - publish 후 PATCH 바인딩 교체 → `GET form-bindings`에 새 `templateId`/`templateVersionId`, Platform render 200
   - 진행 중 바인딩 교체 → 409 `FORM_BINDING_TEMPLATE_LOCKED`

## FE 후속 (참고)

- A 배포 후 2단계에 `ownerProgramId` 추가, 5단계 `description` 라벨 제거.
