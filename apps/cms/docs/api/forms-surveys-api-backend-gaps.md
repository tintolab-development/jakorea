# 템플릿 양식 API — 백엔드 핸드오프 (갭·미구현·스펙 불일치)

CMS `/templates/form-management` 작성·발급 양식 mock → `forms-surveys` API 전환 시, **백엔드에 요청·확인이 필요한 항목** 목록입니다.

OpenAPI 기준: `openapi/backend.openapi.json` (v9) · subset `openapi/forms-surveys.openapi.json` (19 paths)  
JSON 계약 SSOT: [form-template-json-contract.md](./form-template-json-contract.md)  
연동 명세: [forms-surveys-api-integration.md](./forms-surveys-api-integration.md)  
마이그레이션 PHASE: [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md)  
**신규 템플릿 생성 전용**: [template-create-api-backend-handoff.md](./template-create-api-backend-handoff.md)

**작성일**: 2026-07-01  
**Swagger 서버 스냅샷**: `https://6920-221-146-247-18.ngrok-free.app//`

---

## 요약 (백엔드 담당 한눈에)

| 구분                   | 설명                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **라우트는 있음**      | `form-templates` / `form-template-versions` / `form-responses` / `form-bindings` 등 19 path — Swagger 「구현 완료」 |
| **당장 막는 갭 (P0)**  | **DB 시드 없음**, enum·`versionStatus` 미문서화, 목록 DTO에 `latestVersionId` 없음                                  |
| **API 자체 없음 (P1)** | 양식 **로고·인장·수료증 배경** 설정, **overlay/editorState** 저장, **발급(ISSUANCE) 시드**                          |
| **연동 대기 (P2)**     | form-bindings·responses **관리 UI**용 운영 API, 프로그램 신청 **커스텀 필드** 도메인                                |

> 프론트는 `forms-surveys` 인프라(Orval·서비스·어댑터)를 준비했으나, **`.env`에 `formsSurveys` 미포함** — P0 시드·계약 전에는 실 API 전환을 시작하지 않습니다.

---

## 우선순위 요약

| 우선순위 | 건수 | 대표 항목                                                                                     |
| -------- | ---- | --------------------------------------------------------------------------------------------- |
| **P0**   | 5    | 27종 templateCode 시드, enum·versionStatus 문서화, `latestVersionId`, 스테이징 smoke          |
| **P1**   | 6    | overlay/editorState 필드, 양식 설정(파일) API, ISSUANCE 시드, copy 응답 `templateCode`        |
| **P2**   | 5    | form-bindings CMS UI, responses 테스트 UI, program-draft 연동, 커스텀 필드, 일괄 마이그레이션 |

---

## 참고 — OpenAPI에 존재하는 forms-surveys 경로 (19)

프론트 Orval subset 기준. **「API 없음」이 아니라 「FE 미연동」** 인 항목과 구분합니다.

| Method           | Path                                                        | FE 연동 PHASE                              |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------ |
| GET              | `/api/admin/form-templates`                                 | PHASE 1 ✅ 준비                            |
| POST             | `/api/admin/form-templates`                                 | PHASE 4 (신규 양식)                        |
| GET/PATCH/DELETE | `/api/admin/form-templates/{templateId}`                    | PHASE 4                                    |
| GET/POST         | `/api/admin/form-templates/{templateId}/versions`           | PHASE 2                                    |
| POST             | `/api/admin/form-templates/{templateId}/versions/copy`      | PHASE 3                                    |
| POST             | `/api/admin/form-templates/versions/{versionId}/publish`    | PHASE 3                                    |
| GET/PUT          | `/api/admin/form-template-versions/{versionId}`             | PHASE 2                                    |
| POST             | `/api/admin/form-template-versions/{versionId}/publish`     | PHASE 3 (중복 publish 경로 — 아래 갭 참고) |
| GET/POST         | `/api/admin/form-templates/responses`                       | PHASE 6                                    |
| GET/POST         | `/api/admin/form-responses` …                               | PHASE 6                                    |
| POST             | `/api/admin/form-responses/submit`                          | PHASE 6                                    |
| GET/POST         | `/api/admin/programs/{programId}/form-bindings`             | PHASE 6                                    |
| PATCH/DELETE     | `/api/admin/programs/{programId}/form-bindings/{bindingId}` | PHASE 6                                    |
| GET              | `/api/admin/form-auto-fill-keys`                            | 미정                                       |
| GET              | `/api/admin/form-submission-files/{id}/download`            | 미정                                       |
| POST             | `/api/me/programs/.../form-bindings/.../responses`          | Platform (CMS 범위 외)                     |
| GET              | `/api/me/programs/.../form-bindings/.../render`             | Platform                                   |

---

## P0 — PHASE 0 차단 (시드·계약·기존 DTO 보완)

### 1. 작성 양식 27종 DB 시드 (API 라우트 아님 · **데이터 없음**)

|                      |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| **화면**             | `/templates/form-management` 작성 양식 탭                                    |
| **UI 요구**          | `templateCode` 27개 목록 + 에디터 초기 `schemaJson`                          |
| **현재**             | 프론트 `template.schema.ts` / `form-template-catalog.ts` 하드코딩만 존재     |
| **갭 유형**          | **운영 데이터 없음** (GET은 되나 빈 목록 또는 FE mock merge)                 |
| **프론트 임시 대응** | mock `writingSections` fallback                                              |
| **BE 요청**          | migration/seed로 아래 표 전량 + template당 version 1건 (`schemaJson` string) |

**시드 표 (SSOT)**

| templateCode                                      | templateName                              | formType (제안) | category (제안) |
| ------------------------------------------------- | ----------------------------------------- | --------------- | --------------- |
| `registration-general`                            | 일반 프로그램 등록 폼                     | `WRITING`       | `REGISTRATION`  |
| `registration-economy`                            | 1사1교 프로그램 등록 폼                   | `WRITING`       | `REGISTRATION`  |
| `registration-ujat`                               | UJAT 프로그램 등록 폼                     | `WRITING`       | `REGISTRATION`  |
| `recruitment-participant-school`                  | 일반_참여 기관 모집 폼                    | `WRITING`       | `RECRUITMENT`   |
| `recruitment-participant-individual`              | 일반_참여자 모집 폼                       | `WRITING`       | `RECRUITMENT`   |
| `recruitment-instructor`                          | 공통_강사 모집 폼                         | `WRITING`       | `RECRUITMENT`   |
| `recruitment-volunteer`                           | 공통_봉사자 모집 폼                       | `WRITING`       | `RECRUITMENT`   |
| `recruitment-ujat-school`                         | UJAT_참여 기관 모집 폼                    | `WRITING`       | `RECRUITMENT`   |
| `recruitment-ujat-volunteer`                      | UJAT_봉사자 모집 폼                       | `WRITING`       | `RECRUITMENT`   |
| `application-participant-school`                  | 일반_참여 기관 신청 폼                    | `WRITING`       | `APPLICATION`   |
| `application-participant-individual`              | 일반_참여자 신청 폼                       | `WRITING`       | `APPLICATION`   |
| `application-instructor`                          | 공통_강사 신청 폼                         | `WRITING`       | `APPLICATION`   |
| `application-volunteer`                           | 공통_봉사자 신청 폼                       | `WRITING`       | `APPLICATION`   |
| `application-economy`                             | 1사1교_참여 기관 신청 폼                  | `WRITING`       | `APPLICATION`   |
| `application-gemini-visiting-training-instructor` | Gemini_찾아가는 연수 강사 신청 폼         | `WRITING`       | `APPLICATION`   |
| `application-gemini-visiting-training-school`     | Gemini_찾아가는 연수 참여 기관 신청 폼    | `WRITING`       | `APPLICATION`   |
| `application-ujat-school`                         | UJAT_참여 기관 신청 폼                    | `WRITING`       | `APPLICATION`   |
| `application-ujat-volunteer`                      | UJAT_봉사자 신청 폼                       | `WRITING`       | `APPLICATION`   |
| `survey-default`                                  | 설문조사                                  | `WRITING`       | `SURVEY`        |
| `survey-student`                                  | 만족도조사 (학생용)                       | `WRITING`       | `SURVEY`        |
| `survey-teacher`                                  | 만족도조사 (교사용)                       | `WRITING`       | `SURVEY`        |
| `survey-admin`                                    | 강의평가 (관리자용)                       | `WRITING`       | `SURVEY`        |
| `agreement-third-party`                           | 지급조서 사전 동의서                      | `WRITING`       | `AGREEMENT`     |
| `agreement-crime`                                 | 성범죄 경력조회 동의서                    | `WRITING`       | `AGREEMENT`     |
| `agreement-notice`                                | 행정정보 공동이용 사전 동의서             | `WRITING`       | `AGREEMENT`     |
| `agreement-expense`                               | 교육진행자 동의 서약서                    | `WRITING`       | `AGREEMENT`     |
| `agreement-portrait`                              | 초상권 수집/이용 동의                     | `WRITING`       | `AGREEMENT`     |

**`schemaJson` 계약 (프론트 제안)**

```json
{
  "schemaVersion": 1,
  "formSettings": { "titleNumbering": "numeric" },
  "paragraphs": []
}
```

- 본문 JSON은 프론트 `createXxxDraft()` factory export 예정 (FE → BE 전달)
- BE v1: **내부 검증 없이 opaque string 저장** 권장

---

### 2. `formType` / `category` / `versionStatus` enum 문서화

|                  |                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **화면**         | 목록 필터, 버전 배지, publish 워크플로                                                                                          |
| **UI 제안값**    | `formType`: `WRITING`, `ISSUANCE` / `category`: `REGISTRATION`, `RECRUITMENT`, `APPLICATION`, `SURVEY`, `AGREEMENT`, `ISSUANCE` |
| **현재 OpenAPI** | `FormTemplateCreateRequest.formType` · `category` — **plain string, enum 없음**                                                 |
| **갭 유형**      | **문서화·검증 누락**                                                                                                            |
| **BE 요청**      | OpenAPI enum 추가 + 허용 값 확정 회신                                                                                           |

---

### 3. `GET /api/admin/form-templates` 목록 item — `latestVersionId` 없음

|                      |                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **화면**             | 에디터 draft load (`admin-form-templates-service.ts`)                                                          |
| **UI 요구**          | 목록 조회 후 바로 `GET /form-template-versions/{versionId}` 호출                                               |
| **현재 DTO**         | `FormTemplateListItemResponse`: `latestVersionNo`, `latestVersionStatus`만 있음 — **`templateVersionId` 없음** |
| **갭 유형**          | **응답 필드 누락**                                                                                             |
| **프론트 임시 대응** | `GET .../{templateId}/versions` 추가 호출 또는 localStorage 캐시 (`form-template-version-cache.ts`)            |
| **BE 제안**          | `latestVersionId`(number) 필드 추가                                                                            |

---

### 4. `schemaJson` 타입 — OpenAPI `unknown` vs DB string

|             |                                                                                    |
| ----------- | ---------------------------------------------------------------------------------- |
| **현재**    | `FormTemplateVersionUpdateRequest.schemaJson` — OpenAPI `unknown`; 응답은 `string` |
| **갭 유형** | 스펙 모호                                                                          |
| **BE 요청** | request/response 모두 **`type: string`** (JSON 문자열) 로 통일 명시                |

---

### 5. 스테이징 실데이터 smoke (라우트 있으나 **검증 데이터 없을 수 있음**)

|          |                                                                                    |
| -------- | ---------------------------------------------------------------------------------- |
| **요청** | 아래 3 curl 성공 + FE adapter parse 확인                                           |
| **1**    | `GET /api/admin/form-templates?formType=WRITING&page=0&size=200`                   |
| **2**    | `GET /api/admin/form-template-versions/{versionId}`                                |
| **3**    | `PUT /api/admin/form-template-versions/{versionId}` body `{ "schemaJson": "..." }` |

**파일럿 templateCode**: `application-participant-individual`

---

## P1 — API·필드 없음 (신규 설계 필요)

### 6. 양식 설정 — 로고·인장·수료증 배경 (**전용 API 없음**)

|                               |                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **화면**                      | 발급 양식 탭 — 수료증/인증서 설정 모달 (`form-template-fullpage-modal.tsx`)                              |
| **UI 요구**                   | `orgLogo`, `orgLogo02`, `certificateBackground`, `chairmanSeal` (파일 URL)                               |
| **현재**                      | `saveFormTemplateSettings()` — **setTimeout 스텁** (`form-template-api.ts`)                              |
| **현재 form-templates PATCH** | `FormTemplateUpdateRequest` — 이름·formType·category·useYn만 (**파일 필드 없음**)                        |
| **갭 유형**                   | **API 없음**                                                                                             |
| **BE 제안 (택1)**             |                                                                                                          |
|                               | A) `PATCH /api/admin/form-templates/{templateId}/settings` + fileId/URL 4종                              |
|                               | B) `schemaJson` 외 `settingsJson` string 컬럼                                                            |
|                               | C) 공통 파일 업로드 API + template 메타에 fileId 참조                                                    |
| **관련**                      | 파일 업로드는 `entities/application/api/file-upload-service` 패턴 존재 — **템플릿 도메인 bind API 필요** |

---

### 7. `overlay` / `editorState` 저장 (**필드 없음**)

|                      |                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------- |
| **화면**             | UJAT 모집/신청, 봉사자 일정 등 에디터                                                 |
| **UI 저장 구조**     | `WritingFormTemplateSaveRecord`: `draft` + `overlay?` + `editorState?` (localStorage) |
| **현재 API**         | `PUT .../versions` — **`schemaJson`만** (`versionLabel` optional)                     |
| **갭 유형**          | **필드 없음**                                                                         |
| **프론트 임시 대응** | `schemaJson` = draft only; overlay는 local 유지                                       |
| **BE 제안 (택1)**    |                                                                                       |
|                      | A) `overlayJson`, `editorStateJson` string on version                                 |
|                      | B) 단일 `extensionJson`                                                               |
|                      | C) v2까지 overlay local only (문서 합의)                                              |

**영향 templateCode (우선)**

- `recruitment-ujat-school`, `recruitment-ujat-volunteer`
- `application-ujat-school`, `application-ujat-volunteer`
- `registration-ujat`

---

### 8. 발급 양식(ISSUANCE) 시드 — **FE 연동 완료, BE 시드 대기**

|                          |                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **화면**                 | `/templates/form-management` 발급 양식 탭 (`issuance-form-tab.tsx`)                           |
| **FE 상태 (2026-07-10)** | 목록 GET + 11종 load/save + 프로그램 실발급 `settingsJson` 연동 **완료**                      |
| **갭 유형**              | **BE DB 시드 등록 대기**. FE 시드 JSON: P0 지급조서 2종 + `document-3` 완료, 잔여 10종 미작성 |
| **상세**                 | [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md) §2·§3.2                    |

**FE 시드 JSON (완료)**

| templateCode                         | 파일                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `document-payment-order-issue`       | [document-payment-order-issue.json](./form-template-seeds/document-payment-order-issue.json)             |
| `document-payment-order-pre-consent` | [document-payment-order-pre-consent.json](./form-template-seeds/document-payment-order-pre-consent.json) |
| `document-3`                         | [document-3-certificate.json](./form-template-seeds/document-3-certificate.json)                         |

**발급 templateCode (FE SSOT — BE 합의 필요)**

| FE key (임시)                        | templateName                                       |
| ------------------------------------ | -------------------------------------------------- |
| `issuance-1`                         | UJAT 결과리포트                                    |
| `issuance-2`                         | UJAT 교육계획서                                    |
| `issuance-ujat-edu-journal`          | UJAT 교육일지                                      |
| `issuance-3`                         | 강의보고서                                         |
| `issuance-4`                         | 정산 신청서                                        |
| `issuance-5`                         | 결과보고서                                         |
| `document-payment-order-issue`       | 지급조서 (발급용)                                  |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서                               |
| `document-3`                         | 수료증                                             |
| `document-participation-certificate` | 참가인증서                                         |
| …                                    | (전체 14종: `issuance-form-api-follow-up.md` §2.1) |

---

### 9. `POST .../versions/copy` — 새 `templateCode` 응답 없음

|               |                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| **화면**      | 작성 양식 «템플릿 만들기» 복제 (`duplicate-writing-template.ts`)                           |
| **UI 요구**   | 복제 후 **새 templateCode**로 라우트 이동                                                  |
| **현재 응답** | `FormVersionAdminResponse` — `templateId`, `templateVersionId`만 (**`templateCode` 없음**) |
| **갭 유형**   | **응답 필드 누락** (또는 copy가 동일 template 내 버전만 생성하는지 규칙 불명)              |
| **BE 요청**   | copy가 **신규 template 생성**이면 `templateCode` 반환; 동일 template이면 FE에 명시         |

---

### 10. publish API 경로 **2종** — canonical 정리

|                  |                                                               |
| ---------------- | ------------------------------------------------------------- |
| **현재 OpenAPI** |                                                               |
|                  | `POST /api/admin/form-templates/versions/{versionId}/publish` |
|                  | `POST /api/admin/form-template-versions/{versionId}/publish`  |
| **갭 유형**      | **중복 라우트** — FE는 전자(`publishVersion`) 사용            |
| **BE 요청**      | deprecated 하나 지정 + OpenAPI 정리                           |

---

### 11. 등록 양식 + 프로그램 mock 묶음 저장 (**form-templates API 범위 밖**)

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **화면**            | 등록 양식 편집 + 일반 프로그램 목록에 임시 행 노출                                          |
| **UI 저장**         | `registration-local-save.ts`: `{ program, registrationDraft }`                              |
| **관련 API (존재)** | `GET/PUT /api/admin/program-draft`, `POST /api/admin/programs/drafts` — **programs 도메인** |
| **갭 유형**         | **통합 스펙 없음** (template draft vs program draft 분리)                                   |
| **BE 요청**         | 등록 양식 template `schemaJson`과 program draft 연동 규칙 (PHASE 4 후반)                    |

---

## P2 — API는 있으나 CMS 미연동 / 후순위

### 12. 프로그램별 신청 커스텀 필드 (`data/mock/form-templates.ts`)

|                   |                                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| **화면**          | 프로그램 신청 — `ApplicationFormTemplate` + `FormFieldDef[]`           |
| **현재**          | mock `getFormTemplateByProgramId()`                                    |
| **forms-surveys** | `WritingFormDraft`와 **별 도메인**                                     |
| **갭 유형**       | **전용 API 불명** (program 상세 `customFields` 또는 binding metadata?) |
| **BE 요청**       | 프로그램별 추가 필드 저장 위치 합의                                    |

---

### 13. `form-bindings` CMS 관리 UI

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| **API**     | `GET/POST /api/admin/programs/{programId}/form-bindings` 등 — **존재** |
| **CMS UI**  | 프로그램 상세 설문/신청 연결 화면 — mock 혼재                          |
| **갭 유형** | FE 미연동 (API 없음 아님)                                              |
| **PHASE**   | 6                                                                      |

---

### 14. 양식 테스트 · 응답 조회 (`form-responses`)

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| **API**     | `GET/POST /api/admin/form-templates/responses`, `form-responses/*` — **존재** |
| **CMS UI**  | 템플릿 양식 관리 화면에 **테스트 제출·응답 목록 UI 없음**                     |
| **갭 유형** | FE 미연동                                                                     |
| **PHASE**   | 6                                                                             |

---

### 15. `form-auto-fill-keys` · `form-submission-files`

|              |                                              |
| ------------ | -------------------------------------------- |
| **API**      | 존재                                         |
| **CMS**      | 자동채움 키·제출 파일 다운로드 UI **미구현** |
| **우선순위** | P2                                           |

---

### 16. localStorage → API 일괄 마이그레이션

|                    |                                                                                   |
| ------------------ | --------------------------------------------------------------------------------- |
| **요구**           | 운영 전환 시 기존 브라우저/local `cms.jakorea.writingFormTemplateSaves.v1` 업로드 |
| **현재 API**       | **일괄 import endpoint 없음**                                                     |
| **BE 제안 (선택)** | `POST /api/admin/form-templates/migrate-local-drafts` 또는 운영 스크립트          |

---

## 프론트가 **알림톡 템플릿과 혼동하지 말 것**

| 도메인         | API                                     | CMS 화면                                         |
| -------------- | --------------------------------------- | ------------------------------------------------ |
| 알림톡/SMS     | `GET /api/admin/notification-templates` | 알림 관리 (`notifications` 모듈) — **이미 연동** |
| 작성/발급 양식 | `GET /api/admin/form-templates`         | `/templates/form-management`                     |

---

## 백엔드 회신 요청 체크리스트 (복붙용)

```
[ ] P0-1  27개 templateCode + schemaJson 시드 일정 / 담당
[ ] P0-2  formType·category·versionStatus enum 최종 표 회신
[ ] P0-3  FormTemplateListItemResponse.latestVersionId 추가 가능 여부
[ ] P0-4  schemaJson request/response string 통일
[ ] P0-5  스테이징 smoke 3종 (목록·GET version·PUT version) 완료 일자
[ ] P1-6  양식 설정(로고·인장·배경) API 설계 (A/B/C)
[ ] P1-7  overlay/editorState 저장 방식 (A/B/C 또는 v2 보류)
[ ] P1-8  ISSUANCE templateCode 표 합의 + 시드 일정
[ ] P1-9  versions/copy 응답에 templateCode / copy semantics
[ ] P1-10 publish canonical path 하나 지정
[ ] P1-11 등록 양식 registrationDraft ↔ program-draft 연동 규칙
```

---

## 프론트 전달 예정 산출물 (BE 시드 입력용)

| 산출물                    | 설명                                                                        | 일정    |
| ------------------------- | --------------------------------------------------------------------------- | ------- |
| `template-meta.seed.json` | 27행 메타 (templateCode, name, formType, category)                          | PHASE 0 |
| `template-seeds/*.json`   | templateCode별 `schemaJson` string                                          | PHASE 0 |
| Contract v1 PR            | [forms-surveys-api-integration.md](./forms-surveys-api-integration.md) 승인 | PHASE 0 |

---

## 변경 이력

| 날짜       | 변경                                                 |
| ---------- | ---------------------------------------------------- |
| 2026-07-01 | 초안 — P0~P2 갭, OpenAPI 19 path 대조, BE 체크리스트 |
