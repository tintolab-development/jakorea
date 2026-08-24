# 템플릿 관리 · 신규 템플릿 생성 — 백엔드 핸드오프

CMS `/templates/form-management` 「+ 신규 템플릿」 플로우 전환에 필요한 **미완료·미비 API / 로직·계약**만 정리한 문서입니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-13 |
| **대상 화면** | 작성 양식 탭 → 「+ 신규 템플릿」 (`TemplateCreateModal`) |
| **OpenAPI** | `forms-surveys` subset (`openapi/forms-surveys.openapi.json`) |
| **관련 문서** | [**전환률 SSOT**](./templates-api-conversion-status-backend-handoff.md) · [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) · [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md) · [form-template-json-contract.md](./form-template-json-contract.md) |

---

## 1. 한눈에 보기

| CMS 사용자 동작 | FE가 기대하는 API | FE 현재 상태 | BE 확인 필요 |
|-----------------|-------------------|--------------|--------------|
| 기존 양식 선택 후 등록 (신청/설문/동의) | `POST /api/admin/form-templates/{templateId}/versions/copy` | 서비스 연결됨 · 실패/env off 시 stub | copy **의미·응답 식별자** |
| 직접 등록 (설문/동의 빈 양식) | `POST /api/admin/form-templates` (+ 초기 DRAFT version) | **미연동** (로컬 `mode=new`만) | create **필수 필드·초기 version·code 정책** |
| (모달 옵션 연동 예정) | `GET /api/admin/form-templates/create-options` | **미연동** | category/creatable 규칙 |

> 알림톡 `notification-templates` 와 **별 도메인**입니다. 본 문서는 `form-templates` / `form-template-versions` 만 다룹니다.

---

## 2. CMS UI 플로우 (FE 기준)

```text
[+ 신규 템플릿]
    │
    ├─ 신청 / 설문 / 동의  → 목록에서 기존 template 선택
    │                         → duplicateWritingTemplate()
    │                         → POST .../{templateId}/versions/copy
    │                         → 성공 시 에디터(mode=edit, id=templateCode)
    │
    └─ 직접 등록          → 설문 | 동의 선택
                              → URL mode=new 만 이동 (API 호출 없음)
                              → 로컬 에디터에서 작성 후 저장 시점에
                                POST create 연동 예정
```

관련 FE 코드:

- `features/template/ui/modal/template-create-modal.tsx`
- `features/template/api/duplicate-writing-template.ts`
- `features/template/api/admin-form-templates-service.ts` → `duplicateFormTemplateVersionRemote`
- `features/template/api/form-templates-api-client.ts` → `copyFormTemplateVersionRemote` 만 래핑  
  (`createTemplate` / `createOptions` 는 Orval에만 있고 **FE HTTP 래퍼 없음**)

---

## 3. 미비·미확정 항목 (BE 회신 요청)

### C1. `POST .../versions/copy` — 복제 의미(semantics) 불명 ⭐ P0

| | |
|--|--|
| **경로** | `POST /api/admin/form-templates/{templateId}/versions/copy` |
| **요청** | `FormTemplateVersionCopyRequest`: `sourceVersionId?`, `versionLabel?` |
| **응답** | `FormVersionAdminResponse` (`templateVersionId`, `templateId`, `templateCode?`, …) |
| **CMS 요구** | 「기존 양식을 기본 구조로 **새 템플릿**을 만든다」 → 복제 후 **별도 편집·목록 행**이 생겨야 함 |
| **갭** | copy가 **(A) 동일 template 내 새 version** 인지 **(B) 신규 template + DRAFT version** 인지 OpenAPI/설명에 없음 |
| **FE 임시 동작** | 응답의 `templateCode`를 쓰지 않고 **원본 `sourceTemplateCode`를 그대로 반환** → 사실상 원본 편집으로 이동 |
| **BE 요청** | A/B 중 무엇인지 명시. CMS 「신규 템플릿」은 **B**가 맞는지 확인. A라면 별도 「template duplicate」 API가 필요 |

**권장 (FE 제안 — B안)**

1. 원본 `schemaJson` / `extensionJson` / `settingsJson` 을 deep copy
2. **새** `templateId` + **새** `templateCode` 발급 (또는 요청으로 code 지정)
3. 새 version `versionStatus = DRAFT`, `versionNo = 1`
4. 응답에 아래를 **항상** 채움:

```json
{
  "templateId": 12345,
  "templateVersionId": 67890,
  "templateCode": "survey-custom-20260713-01",
  "versionNo": 1,
  "versionStatus": "DRAFT"
}
```

---

### C2. copy 응답 `templateCode` 실사용 보장 ⭐ P0

| | |
|--|--|
| **스키마** | `FormVersionAdminResponse.templateCode` 는 optional 로 존재 |
| **갭** | 실제 응답에서 `templateCode` / 새 `templateId` 가 채워지는지 스테이징 확인 필요. FE 갭 문서(P1-9)에서도 「응답에 code 없음 또는 미사용」으로 기록됨 |
| **BE 요청** | copy 성공 시 `templateId`, `templateVersionId`, `templateCode` **필수(non-null)** 로 문서화·검증. OpenAPI `required` 반영 권장 |
| **에러** | 원본 없음 404, 동시성/중복 409 — `error.code` 예시 회신 |

---

### C3. `POST /api/admin/form-templates` — 직접 등록(완전 신규) 계약 미비 ⭐ P0

| | |
|--|--|
| **경로** | `POST /api/admin/form-templates` |
| **요청** | `FormTemplateCreateRequest` — **모든 필드 optional** (`templateCode`, `templateName`, `formType`, `category`, `description`, `useYn`, `versionLabel`, `schemaJson`, `extensionJson`, `settingsJson`) |
| **응답** | `FormTemplateResponse` (`templateId`, `templateCode`, `versions?`, …) |
| **CMS 요구** | 「직접 등록」: 설문/동의 **빈(또는 기본 단락) 양식**을 만들고 에디터로 진입 |
| **FE 현재** | API 미호출. 저장 연동 시 create → (필요 시) version PUT |
| **갭** | 필수 필드·`templateCode` 생성 규칙·초기 DRAFT version 자동 생성 여부·빈 `schemaJson` 허용 여부 미문서화 |

**BE 회신 요청**

| # | 질문 |
|---|------|
| Q1 | 필수 필드 최소셋은? (제안: `templateName`, `formType`, `category`) |
| Q2 | `templateCode` 미지정 시 BE가 자동 발급하는가? 규칙(prefix/suffix)? |
| Q3 | create 한 번에 **version 1 DRAFT** 가 생기는가? 응답 `versions[0].templateVersionId` 보장? |
| Q4 | 빈 `schemaJson` (`{"paragraphs":[]}` 등) 허용? 아니면 FE가 시드 JSON 필수 전송? |
| Q5 | `formType` / `category` enum 최종 값 (작성 양식: WRITING + APPLICATION/SURVEY/AGREEMENT 등) |
| Q6 | `systemTemplate=true` 원본만 copy 가능 / 사용자 생성분은 `systemTemplate=false` 인지 |

**FE가 보낼 예시 (직접 등록 · 설문)**

```json
{
  "templateName": "신규 설문 양식",
  "formType": "WRITING",
  "category": "SURVEY",
  "useYn": true,
  "versionLabel": "v1",
  "schemaJson": "{\"paragraphs\":[]}"
}
```

성공 시 FE는 `templateCode`(또는 `templateId`→목록 재조회)로 `mode=edit` 진입합니다.  
응답에 **즉시 편집 가능한 `latestVersionId` / `versions[0].templateVersionId`** 가 있으면 왕복 1회를 줄일 수 있습니다.

---

### C4. `GET /api/admin/form-templates/create-options` — 스펙·권한만 있고 FE 미사용

| | |
|--|--|
| **경로** | `GET /api/admin/form-templates/create-options` |
| **응답** | `FormTemplateCreateOptionResponse[]`: `category`, `label`, `creatable`, `reason` |
| **갭** | 어떤 category가 creatable인지, 모달 라디오(신청/설문/동의/직접등록)와 매핑이 문서화되지 않음 |
| **BE 요청** | 샘플 응답 1건 + 「신청 양식은 시드 복제만 / 설문·동의만 직접 create」 같은 정책이 있으면 명시 |
| **권한** | OpenAPI: `FORM_TEMPLATE_READ` — create API 권한과 정합 여부 확인 |

---

### C5. create / copy 후 목록·식별자 정합 (부가)

| # | 이슈 | BE 요청 |
|---|------|---------|
| C5-1 | 목록 DTO에 `latestVersionId` 부재 (기존 P0-3) | create/copy 직후 GET 목록만으로 에디터 version 해석 어려움 → 목록에 `latestVersionId` 추가 또는 create/copy 응답에 version id 필수 |
| C5-2 | `templateCode` 중복 시 409 body | `error.code` / 메시지 형식 회신 |
| C5-3 | 시스템 시드 템플릿 삭제·rename 가능 여부 | 신규 생성분만 삭제 가능인지 정책 |

---

## 4. FE 측 현황 (참고 · BE 작업 범위 아님)

| 항목 | 상태 |
|------|------|
| Orval `createTemplate` / `copyVersion` / `createOptions` | 생성됨 |
| FE HTTP 래퍼 (`form-templates-api-client`) | **copy만** |
| `duplicateWritingTemplate` | remote on → copy, 실패 시 **원본 id stub** |
| `.env` `formsSurveys` | 모듈 키 존재 시 실호출 가능 (JWT 필요) |
| 직접 등록 | API 없이 로컬 에디터 |
| PHASE (마이그레이션) | copy = PHASE 3 · create = PHASE 4 로 분류 |

BE 계약(C1–C3)이 확정되면 FE는:

1. copy 응답 `templateCode`로 라우팅
2. `createTemplate` 래퍼 + 직접 등록 연동
3. (선택) `create-options`로 모달 옵션 제어

를 진행할 수 있습니다.

---

## 5. 스테이징 스모크 요청 (BE)

copy·create 계약 확정 후 아래를 한 번씩 검증해 주세요.

```text
[ ] 1. GET  /api/admin/form-templates?formType=WRITING
       → templateId / templateCode 확보

[ ] 2. POST /api/admin/form-templates/{templateId}/versions/copy
       body: { "sourceVersionId": <latest>, "versionLabel": "copy-test" }
       → 응답에 templateId / templateVersionId / templateCode 비어 있지 않은지
       → (B안이면) GET 목록에 새 행이 생겼는지

[ ] 3. POST /api/admin/form-templates
       body: { "templateName": "smoke-survey", "formType": "WRITING", "category": "SURVEY", "schemaJson": "{\"paragraphs\":[]}" }
       → 201/200 + templateCode + 편집 가능한 version id

[ ] 4. GET  /api/admin/form-templates/create-options
       → category별 creatable 샘플
```

---

## 6. 백엔드 회신 체크리스트 (복붙용)

```
[ ] C1   copy semantics: (A) 동일 template 새 version  /  (B) 신규 template  ← CMS는 B 희망
[ ] C2   copy 응답 templateId + templateVersionId + templateCode 필수 보장 + OpenAPI required
[ ] C3-Q1 create 필수 필드 최소셋
[ ] C3-Q2 templateCode 자동 발급 규칙 (또는 FE 지정 필수)
[ ] C3-Q3 create 시 DRAFT version 1 자동 생성 여부 + 응답에 versionId
[ ] C3-Q4 빈 schemaJson 허용 여부
[ ] C3-Q5 formType / category enum 최종표
[ ] C3-Q6 systemTemplate / 사용자 생성분 정책
[ ] C4   create-options 샘플 응답 + creatable 정책
[ ] C5-1 latestVersionId (목록 또는 create/copy 응답)
[ ] C5-2 code 중복 409 error.code
[ ] 스모크 §5 통과 일자 / 환경 URL
```

---

## 7. 기존 갭 문서와의 관계

| 본 문서 | [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) |
|---------|--------------------------------------------------------------------------|
| C1–C2 | P1-9 (`versions/copy` templateCode) 상세화 |
| C3 | PATH 표「POST form-templates = PHASE 4」의 **계약 공백** |
| C5-1 | P0-3 (`latestVersionId`) 재강조 |

전체 forms-surveys 갭(시드 27종, overlay, 발급 등)은 기존 문서를 따르고, **신규 템플릿 생성만** 본 문서를 SSOT로 사용하면 됩니다.
