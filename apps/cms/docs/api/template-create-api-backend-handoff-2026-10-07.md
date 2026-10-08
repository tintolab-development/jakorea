# 템플릿 관리 · 작성 양식 신규 등록 — 백엔드 핸드오프

CMS `/templates/form-management` 「+ 신규 템플릿」을 **원본을 덮어쓰지 않는 새 template 행**으로 만들기 위한 계약입니다. 이 문서가 「신규 템플릿 생성」SSOT입니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-10-07 (2026-07-13 문서를 전면 개정) |
| **대상 화면** | 작성 양식 탭 → 「+ 신규 템플릿」 (`TemplateCreateModal`) |
| **OpenAPI** | `forms-surveys` subset (`openapi/forms-surveys.openapi.json`) |
| **관련 문서** | [전환률 SSOT](./templates-api-conversion-status-backend-handoff.md) · [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) · [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md) · [form-template-json-contract.md](./form-template-json-contract.md) |

---

## 0. 범위

### 포함 — 작성 양식 4종

| 화면 | API `category` | 복제 (기존 양식 선택) | 직접 등록 (빈 양식) |
|------|----------------|----------------------|---------------------|
| 모집 | `RECRUITMENT` | **필수** | 없음 (시드 복제만) |
| 신청 | `APPLICATION` | **필수** | 없음 (시드 복제만) |
| 설문 | `SURVEY` | **필수** | **필수** (`POST /form-templates`) |
| 동의 | `AGREEMENT` | **필수** | **필수** (`POST /form-templates`) |

### 제외

- 등록 양식 (`REGISTRATION`) — 신규 모달에 없음. 프로그램 위저드·바인딩용.
- 발급 양식 (`ISSUANCE`) — 탭·`formType`이 다름.
- 알림톡 (`notification-templates`) — 별 도메인.
- 프로그램 등록 중 `POST .../versions/copy` (`ownerProgramDraftId`) — **유지**. 템플릿 관리 「신규」와 역할이 다름.

---

## 1. 왜 전면 개편이 필요한가

### 확인된 사실

| API | 실제 동작 |
|-----|-----------|
| `POST /api/admin/form-templates/{templateId}/versions/copy` | **같은 template 안에 version만 추가.** 응답 `templateCode`가 원본과 같음. |
| `POST /api/admin/form-templates` + `source*` + `RECRUITMENT` | **400** `BAD_REQUEST` (`field`/`details` null). 2026-10-07, traceId `3ed2fb6a78e44bc7bc6e2c9ee323eea1`. |

copy를 「신규 템플릿」에 쓰면 다음이 발생합니다.

1. 서버에 새 template 행이 없음.
2. FE가 `…-copy-{timestamp}` 로컬 code를 만들고, 메모리 캐시에서만 원본 `templateId`에 연결.
3. 이름 PATCH·저장이 **원본 템플릿**에 적용될 수 있음.
4. 새로고침 후 캐시가 비면 저장 시 「저장할 템플릿 버전 ID를 찾을 수 없습니다」.

FE는 2026-10-07부터 copy 대신 create 우회를 시도했으나 모집 복제에서 400이 납니다. **원본을 덮어쓰지 않는 유일한 방법은 서버가 새 template 행을 만드는 복제 API**입니다.

---

## 2. P0 — 복제 전용 API

### 경로

`POST /api/admin/form-templates/{templateId}/duplicate`

path `templateId` = 복제할 **원본**의 numeric id.

### 요청

```json
{
  "templateName": "일반_참여 기관 모집 폼 (1)",
  "sourceVersionId": 89
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `templateName` | 예 | 복제본 표시명. 동명 회피는 FE가 붙여 보냄. |
| `sourceVersionId` | 권장 | 복사할 원본 version. 생략 시 원본 latest. |

FE는 `templateCode`를 **보내지 않습니다.** 서버가 발급합니다.

### 서버가 할 일

1. 원본 버전의 `schemaJson` / `extensionJson` / `settingsJson`을 deep copy.
2. **새** `templateId` + **새** `templateCode` 발급.
3. version 1, `versionStatus = DRAFT`.
4. `systemTemplate = false`, 삭제 가능 (`deletable = true`).
5. `category`는 원본과 동일 (`RECRUITMENT` / `APPLICATION` / `SURVEY` / `AGREEMENT`).
6. `baseTemplateCode` = **최초 카탈로그 원본** code. 복제본을 다시 복제해도 최초 원본을 유지.
7. `FORM_SCHEMA_IMMUTABLE`은 `systemTemplate=true` 원본에만 적용. **복제본 schema PUT은 허용.**

### 응답 — 아래 필드 모두 필수 (non-null)

```json
{
  "templateId": 12345,
  "templateCode": "(서버 발급)",
  "templateName": "일반_참여 기관 모집 폼 (1)",
  "category": "RECRUITMENT",
  "baseTemplateCode": "recruitment-participant-school",
  "systemTemplate": false,
  "versions": [
    {
      "templateVersionId": 67890,
      "versionNo": 1,
      "versionStatus": "DRAFT"
    }
  ]
}
```

`baseTemplateCode` 예: `recruitment-participant-school`, `application-instructor`, `survey-student`, `agreement-portrait`.  
FE는 이 값으로 에디터 종류를 고릅니다. `-copy-` 접미사 추정은 제거합니다.

### `versions/copy`와의 역할 분리

| API | 용도 |
|-----|------|
| `POST .../duplicate` | 템플릿 관리 「신규」— **새 template 행** |
| `POST .../versions/copy` | 프로그램 등록 바인딩 (`ownerProgramDraftId`) — **기존 유지** |

템플릿 관리 신규 플로우는 duplicate만 호출합니다.

---

## 3. P0 — 목록 · 단건 · by-code 필드 추가

다음 응답에 동일 필드를 넣어 주세요.

- `GET /api/admin/form-templates` (작성 양식 목록)
- 단건 GET
- `GET .../payload` (by-code)

| 필드 | 용도 |
|------|------|
| `latestVersionId` | 저장 PUT 대상. FE 메모리 캐시 제거. |
| `latestVersionStatus` | DRAFT / PUBLISHED 표시 |
| `baseTemplateCode` | 에디터·lock 판단. 카탈로그 원본은 자신과 같거나 null. |
| `systemTemplate` | 원본 vs 사용자 복제본 |
| `deletable` | 목록·상세 삭제 버튼 |

이 필드가 있으면 FE `sessionStorage` 로컬 카탈로그(`user-created-writing-template-catalog`)와 code→ID 메모리 캐시를 없앨 수 있습니다.

---

## 4. P0 — 설문·동의 직접 등록 (기존 create 유지)

`POST /api/admin/form-templates`는 **빈 양식 전용**입니다. 복제에 쓰지 않습니다.

허용 `category`: `SURVEY` | `AGREEMENT` 만.

### 요청 필수

```json
{
  "templateName": "신규 설문 양식",
  "formType": "WRITING",
  "category": "SURVEY",
  "useYn": true,
  "versionLabel": "v1",
  "schemaJson": "{\"schemaVersion\":1,\"formSettings\":{\"titleNumbering\":\"none\"},\"paragraphs\":[]}"
}
```

동의는 `category: "AGREEMENT"` + 기본 동의 단락 `schemaJson`.

| 규칙 | 내용 |
|------|------|
| 필수 | `templateName`, `formType: WRITING`, `category`, `schemaJson` (빈 단락 또는 기본 시드) |
| `templateCode` | FE 미지정. 서버 발급. |
| 응답 필수 | `templateCode` + `versions[0].templateVersionId` (version 1 DRAFT) |
| `systemTemplate` | `false` |

### `source*` / `base*` 를 create에 넣지 말 것

`FormTemplateCreateRequest`에 `sourceTemplateId` / `sourceVersionId` / `sourceTemplateCode` / `base*`가 있습니다.  
2026-10-07 FE가 모집 복제용으로 이 필드 + `schemaJson` + `templateCode`를 함께 보내 **400**이 났습니다 (traceId `3ed2fb6a78e44bc7bc6e2c9ee323eea1`).

- 복제 의미는 **§2 duplicate API**로 옮기거나
- create에서 쓰면 안 된다고 OpenAPI·문서에 명시해 주세요.

모집·신청 `category`로 create하는 것은 거부해도 됩니다. 빈 모집/신청 양식은 CMS에 없습니다.

---

## 5. P1 — create-options

`GET /api/admin/form-templates/create-options`

모달 라디오와 맞출 샘플:

| `category` | 직접 등록 `creatable` | `reason` 예 |
|------------|----------------------|-------------|
| `RECRUITMENT` | `false` | 시드 복제만 가능 |
| `APPLICATION` | `false` | 시드 복제만 가능 |
| `SURVEY` | `true` | |
| `AGREEMENT` | `true` | |

복제 가능 여부는 별도 플래그로 주거나, 작성 양식 4종은 모두 복제 가능으로 문서화해 주세요.

권한: create/duplicate와 `FORM_TEMPLATE_READ` 정합 확인.

---

## 6. P1 — 에러 계약

모든 에러에 한국어 `message`.

| HTTP | 상황 | body |
|------|------|------|
| 400 | 검증 실패 | `error.field`, `error.details` **채움** (오늘처럼 `null`이면 FE가 원인을 모름) |
| 404 | 원본 template/version 없음 | |
| 409 | `templateName` 또는 `templateCode` 중복, 동시성 | `error.code` 예시 회신 |

---

## 7. FE 현재 상태 (참고 · BE 작업 범위 아님)

| 항목 | 상태 (2026-10-07) |
|------|-------------------|
| 「신규」복제 | `duplicateFormTemplateVersionRemote` → `POST /form-templates` (source+내용+로컬 `templateCode`). 모집 400. |
| 원격 실패 | stub fallback 없음. 모달 「등록 실패」alert. |
| 설문/동의 직접 등록 | 에디터 저장 시 `createWritingFormTemplateRemote` (기존 create). |
| 목록 신규 행 | 서버에 없으면 `sessionStorage` 카탈로그로 붙임. |
| 에디터 종류 | `lookupTemplateRegistry` — 정확 일치 또는 `…-copy-{ts}` / `survey-custom-` 접미사. |
| 프로그램 `versions/copy` | `sync-registration-form-bindings` 등 — **변경 없음**. |

BE duplicate·목록 필드가 반영되기 전까지 모집·신청 신규 등록은 실패할 수 있습니다.

---

## 8. BE 반영 후 FE 후속 (이번 핸드오프 범위 밖)

1. `duplicateFormTemplateVersionRemote`를 `POST .../duplicate`로 교체. create 우회·`-copy-{ts}` 지정 제거.
2. registry / 프로그램 위저드 / 구조 lock을 `baseTemplateCode` 기준으로 변경.
3. `user-created-writing-template-catalog` 제거. 목록은 서버 응답만 사용.

---

## 9. 스테이징 스모크 (BE)

```text
[ ] 1. GET  /api/admin/form-templates?formType=WRITING
       → 모집 원본 templateId / templateCode / latestVersionId

[ ] 2. POST /api/admin/form-templates/{templateId}/duplicate
       body: { "templateName": "smoke-recruitment-copy", "sourceVersionId": <latest> }
       → 200 + 새 templateId / 새 templateCode(원본과 다름) / baseTemplateCode / versions[0].templateVersionId
       → GET 목록에 새 행 + systemTemplate=false

[ ] 3. 복제본 version PUT (schemaJson 변경)
       → 200 (원본 IMMUTABLE이 복제본에 적용되면 안 됨)
       → 원본 schema 불변

[ ] 4. POST /api/admin/form-templates
       body: { "templateName": "smoke-survey", "formType": "WRITING", "category": "SURVEY", "schemaJson": "{\"paragraphs\":[]}" }
       → 200 + templateCode + versions[0].templateVersionId

[ ] 5. POST /api/admin/form-templates  category=RECRUITMENT (빈 양식)
       → 400 (직접 등록 불가) + error.field/details

[ ] 6. GET  /api/admin/form-templates/create-options
       → 모집/신청 creatable=false, 설문/동의 true
```

---

## 10. 백엔드 회신 체크리스트

```
[ ] duplicate 경로·요청/응답 확정 (OpenAPI required)
[ ] 작성 양식 4종(RECRUITMENT/APPLICATION/SURVEY/AGREEMENT) 복제 가능
[ ] 새 templateId + 새 templateCode 서버 발급 (원본 code와 다름)
[ ] baseTemplateCode = 최초 카탈로그 원본, 재복제 시에도 유지
[ ] 복제본 systemTemplate=false, schema PUT 허용
[ ] 목록/단건/by-code: latestVersionId, latestVersionStatus, baseTemplateCode, systemTemplate, deletable
[ ] create = SURVEY/AGREEMENT 빈 양식만. source*/base* 는 create에서 사용 금지 또는 duplicate로 이전
[ ] create 응답 templateCode + versions[0].templateVersionId
[ ] versions/copy 는 프로그램 바인딩 전용 유지
[ ] create-options 샘플 + 모집/신청 직접등록 false
[ ] 400 field/details, 404, 409 + 한국어 message
[ ] 스모크 §9 통과 일자 / 환경 URL
```
