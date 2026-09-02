# 폼 양식 관리 — DB 시드 백엔드 핸드오프

> 작성: 2026-09-02  
> 목적: CMS `/templates/form-management` **작성·발급 양식 47종**을 BE DB에 시드하고, FE가 `formsSurveys` 실 API로 전환할 수 있게 한다.  
> 선행: FE 1차 QA 완료 ([`form-template-fe-gap-report.md`](../qa/form-template-fe-gap-report.md) — E2E 59 passed / 1 skipped)

---

## 1. 목표·완료 조건

### Goal

관리자 JWT + `VITE_REAL_API_MODULES=formsSurveys` 환경에서 CMS 양식 관리 화면이 **mock/localStorage 없이** API만으로 동작하도록, 아래를 DB에 넣는다.

| # | 완료 조건 |
|---|-----------|
| 1 | **작성 33종** + **발급 14종** = **47 templateCode** 각 1행 + **version 1건(DRAFT)** |
| 2 | `GET /api/admin/form-templates?formType=WRITING` → category별 33건, `templateCode`·`templateName`·`latestVersionId` 포함 |
| 3 | `GET /api/admin/form-templates?formType=ISSUANCE` → 14건 (FE 목록은 9종만 노출 — §4.3) |
| 4 | `GET /api/admin/form-template-versions/{latestVersionId}` → 시드 JSON과 **byte-level 동일**한 `schemaJson` / `extensionJson` / `settingsJson` string |
| 5 | `PUT /api/admin/form-template-versions/{versionId}` 후 재조회 시 FE 에디터가 단락·overlay·settings 복원 |
| 6 | **인증서 Payload D 5종** 전부 시드 + 종별 `settingsJson` 독립 — [`certificate-form-seeds-backend-handoff.md`](./certificate-form-seeds-backend-handoff.md) |
| 7 | 시드 **idempotent** — 재실행 시 중복 행 없음 (`templateCode` natural key upsert) |
| 8 | **local/dev/staging** 전용. prod 마이그레이션에 넣지 않음 |

### Out of scope (이번 시드에서 하지 않음)

- Platform 사용자 제출(`form-responses/submit`)·프로그램 binding 운영 데이터
- 신규 설문(`mode=new&type=survey`) — 관리자가 UI에서 생성
- 양식 테스트 탭(`form-test-*`) — BE catalog 밖
- 문서 PDF 서버 생성 ([`form-template-document-download-backend-handoff.md`](./form-template-document-download-backend-handoff.md))
- `recruitment-ujat-volunteer` FE 진입 크래시 수정 (FE 버그 — §8)

---

## 2. SSOT · 시드 JSON 위치

### 2.1 시드 파일 (FE가 생성·검증 완료)

| 구분 | 종수 | 인덱스 문서 | JSON 디렉터리 |
|------|------|-------------|---------------|
| 작성 | 33 | [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md) | [`form-template-seeds/`](./form-template-seeds/) |
| 발급 | 14 | [`issuance-form-seeds-backend-handoff.md`](./issuance-form-seeds-backend-handoff.md) | 동일 |

- **총 46개 JSON 파일** (파일명 = `templateCode`, 예외: `document-3-certificate.json` → `document-3`)
- `registration-general.json` 포함 — 작성 33종 전체 커버
- FE 재생성: `exportWritingFormTemplateSeeds()` / `exportIssuanceFormTemplateSeeds()` (`src/features/template/lib/export-writing-form-template-seeds.ts`)

### 2.2 templateCode · 표시명 SSOT

- 작성: `packages/form-schema/src/catalog/form-template-catalog.ts` → `TEMPLATE_CODE_CATALOG`
- 발급: 동 파일 → `ISSUANCE_TEMPLATE_CODE_CATALOG`
- FE 목록 노출: `ISSUANCE_FORM_LIST_TEMPLATE_CODES` (9종)

### 2.3 JSON 계약

[`form-template-json-contract.md`](./form-template-json-contract.md) — **필독**

| API 필드 | DB 저장 형태 | 주의 |
|----------|-------------|------|
| `schemaJson` | **JSON text string** (object를 한 번 stringify) | 이중 stringify 금지 |
| `extensionJson` | JSON text string `{ overlay, editorState, uiState }` | Payload C 필수 |
| `settingsJson` | JSON text string 또는 `null` | Payload D/E |

---

## 3. Payload 종류별 시드 규칙

| Payload | schemaJson | extensionJson | settingsJson | 대상 |
|---------|------------|---------------|--------------|------|
| **A** | `WritingFormDraft` (paragraphs ≥ 1) | 빈 object 허용 | `null` | 대부분 작성·발급 보고 |
| **C** | `WritingFormDraft` | **overlay/editorState 시드 포함** | `null` | UJAT 등록·모집·신청 6종 |
| **D** | `null` | 빈 object | **settingsJson only** | 인증서 5종, `agreement-crime`(paragraphs 빈 배열) |
| **E** | 빈 paragraphs object | 빈 object | `null` | `issuance-1`, `issuance-5`, `document-1` (레거시·목록 비노출) |

### Payload C (extensionJson 필수) — 6종

| templateCode | extensionJson 시드 내용 |
|--------------|-------------------------|
| `registration-ujat` | UJAT 등록 overlay·editorState |
| `recruitment-ujat-school` | 모집 overlay |
| `recruitment-ujat-volunteer` | 모집 overlay |
| `application-ujat-school` | 신청 overlay |
| `application-ujat-volunteer` | 신청 overlay |

→ 각 JSON 파일의 `extensionJson` 키를 **그대로** DB에 넣는다. FE가 `extensionJsonToExtensionPayload()`로 파싱.

### Payload D 특수

| templateCode | BE 추가 작업 |
|--------------|-------------|
| `agreement-crime` | 기본 동의서 PNG를 스토리지 업로드 후 `settingsJson.documentImageUrl`에 CDN URL. FE 기본 에셋: `apps/cms/src/assets/images/template/성범좌 경력 조회.png` |
| `document-2`~`document-5`, `document-participation-certificate` | **5종 전체** 시드·종별 독립 `settingsJson`. 상세: [`certificate-form-seeds-backend-handoff.md`](./certificate-form-seeds-backend-handoff.md). 이미지: [`certificate-image-storage-handoff.md`](./certificate-image-storage-handoff.md) |

---

## 4. 시드 대상 전체 목록

### 4.1 작성 양식 — 33종 (`formType=WRITING`)

| category | templateCode | templateName | Payload | 시드 JSON |
|----------|--------------|--------------|---------|-----------|
| REGISTRATION | `registration-general` | 일반 프로그램 등록 폼 | A | [registration-general.json](./form-template-seeds/registration-general.json) |
| REGISTRATION | `registration-economy` | 1사1교 프로그램 등록 폼 | A | [registration-economy.json](./form-template-seeds/registration-economy.json) |
| REGISTRATION | `registration-ujat` | UJAT 프로그램 등록 폼 | C | [registration-ujat.json](./form-template-seeds/registration-ujat.json) |
| REGISTRATION | `registration-trained-teachers` | 교육받은 교사 프로그램 등록 폼 | A | [registration-trained-teachers.json](./form-template-seeds/registration-trained-teachers.json) |
| RECRUITMENT | `recruitment-instructor` | 공통_강사 모집 폼 | A | [recruitment-instructor.json](./form-template-seeds/recruitment-instructor.json) |
| RECRUITMENT | `recruitment-volunteer` | 공통_봉사자 모집 폼 | A | [recruitment-volunteer.json](./form-template-seeds/recruitment-volunteer.json) |
| RECRUITMENT | `recruitment-participant-school` | 일반_참여 기관 모집 폼 | A | [recruitment-participant-school.json](./form-template-seeds/recruitment-participant-school.json) |
| RECRUITMENT | `recruitment-participant-individual` | 일반_참여자 모집 폼 | A | [recruitment-participant-individual.json](./form-template-seeds/recruitment-participant-individual.json) |
| RECRUITMENT | `recruitment-economy` | 1사1교_참여 기관 모집 폼 | A | [recruitment-economy.json](./form-template-seeds/recruitment-economy.json) |
| RECRUITMENT | `recruitment-gemini-visiting-training` | Gemini_찾아가는 연수 모집 폼 | A | [recruitment-gemini-visiting-training.json](./form-template-seeds/recruitment-gemini-visiting-training.json) |
| RECRUITMENT | `recruitment-ujat-school` | UJAT_참여 기관 모집 폼 | C | [recruitment-ujat-school.json](./form-template-seeds/recruitment-ujat-school.json) |
| RECRUITMENT | `recruitment-ujat-volunteer` | UJAT_봉사자 모집 폼 | C | [recruitment-ujat-volunteer.json](./form-template-seeds/recruitment-ujat-volunteer.json) |
| RECRUITMENT | `recruitment-trained-teachers` | 교육받은 교사_참여 기관 모집 폼 | A | [recruitment-trained-teachers.json](./form-template-seeds/recruitment-trained-teachers.json) |
| APPLICATION | `application-instructor` | 공통_강사 신청 폼 | A | [application-instructor.json](./form-template-seeds/application-instructor.json) |
| APPLICATION | `application-volunteer` | 공통_봉사자 신청 폼 | A | [application-volunteer.json](./form-template-seeds/application-volunteer.json) |
| APPLICATION | `application-participant-school` | 일반_참여 기관 신청 폼 | A | [application-participant-school.json](./form-template-seeds/application-participant-school.json) |
| APPLICATION | `application-participant-individual` | 일반_참여자 신청 폼 | A | [application-participant-individual.json](./form-template-seeds/application-participant-individual.json) |
| APPLICATION | `application-economy` | 1사1교_참여 기관 신청 폼 | A | [application-economy.json](./form-template-seeds/application-economy.json) |
| APPLICATION | `application-gemini-visiting-training-instructor` | Gemini_찾아가는 연수 강사 신청 폼 | A | [application-gemini-visiting-training-instructor.json](./form-template-seeds/application-gemini-visiting-training-instructor.json) |
| APPLICATION | `application-gemini-visiting-training-school` | Gemini_찾아가는 연수 참여 기관 신청 폼 | A | [application-gemini-visiting-training-school.json](./form-template-seeds/application-gemini-visiting-training-school.json) |
| APPLICATION | `application-ujat-school` | UJAT_참여 기관 신청 폼 | C | [application-ujat-school.json](./form-template-seeds/application-ujat-school.json) |
| APPLICATION | `application-ujat-volunteer` | UJAT_봉사자 신청 폼 | C | [application-ujat-volunteer.json](./form-template-seeds/application-ujat-volunteer.json) |
| APPLICATION | `application-trained-teachers` | 교육받은 교사_참여 기관 신청 폼 | A | [application-trained-teachers.json](./form-template-seeds/application-trained-teachers.json) |
| SURVEY | `survey-default` | 설문조사 | A | [survey-default.json](./form-template-seeds/survey-default.json) |
| SURVEY | `survey-student` | 만족도조사 (학생용) | A | [survey-student.json](./form-template-seeds/survey-student.json) |
| SURVEY | `survey-teacher` | 만족도조사 (교사용) | A | [survey-teacher.json](./form-template-seeds/survey-teacher.json) |
| SURVEY | `survey-admin` | 강의평가 (관리자용) | A | [survey-admin.json](./form-template-seeds/survey-admin.json) |
| AGREEMENT | `agreement-portrait` | 초상권 수집·이용 동의 | A | [agreement-portrait.json](./form-template-seeds/agreement-portrait.json) |
| AGREEMENT | `agreement-third-party` | 지급조서 사전 동의서 | A | [agreement-third-party.json](./form-template-seeds/agreement-third-party.json) |
| AGREEMENT | `agreement-crime` | 성범죄 경력조회 및 아동학대 관련 범죄전력조회 동의서 | D | [agreement-crime.json](./form-template-seeds/agreement-crime.json) |
| AGREEMENT | `agreement-notice` | 행정정보 공동이용 사전 동의서 | A | [agreement-notice.json](./form-template-seeds/agreement-notice.json) |
| AGREEMENT | `agreement-expense` | 교육진행자 동의 서약서 | A | [agreement-expense.json](./form-template-seeds/agreement-expense.json) |

단락 id 상세: [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md) §단락 id 요약

### 4.2 발급 양식 — 14종 (`formType=ISSUANCE`)

| templateCode | templateName | Payload | FE 목록 노출 | 시드 JSON |
|--------------|--------------|---------|-------------|-----------|
| `issuance-2` | UJAT 교육계획서 | A | ☑ | [issuance-2.json](./form-template-seeds/issuance-2.json) |
| `issuance-ujat-edu-journal` | UJAT 교육일지 | A | ☑ | [issuance-ujat-edu-journal.json](./form-template-seeds/issuance-ujat-edu-journal.json) |
| `issuance-3` | 강의보고서 | A | ☑ | [issuance-3.json](./form-template-seeds/issuance-3.json) |
| `issuance-4` | 정산 신청서 | A | ☑ | [issuance-4.json](./form-template-seeds/issuance-4.json) |
| `document-payment-order-issue` | 지급조서 (발급용) | A | ☑ | [document-payment-order-issue.json](./form-template-seeds/document-payment-order-issue.json) |
| `document-participation-certificate` | 참가인증서 | D | ☑ | [document-participation-certificate.json](./form-template-seeds/document-participation-certificate.json) |
| `document-3` | 수료증 | D | ☑ | [document-3-certificate.json](./form-template-seeds/document-3-certificate.json) |
| `document-4` | 강사 활동 인증서 | D | ☑ | [document-4.json](./form-template-seeds/document-4.json) |
| `document-5` | 봉사 활동 인증서 | D | ☑ | [document-5.json](./form-template-seeds/document-5.json) |
| `issuance-1` | UJAT 결과리포트 | E | ✗ | [issuance-1.json](./form-template-seeds/issuance-1.json) |
| `issuance-5` | 결과보고서 | E | ✗ | [issuance-5.json](./form-template-seeds/issuance-5.json) |
| `document-1` | 지출증빙서류(필수폼) | E | ✗ | [document-1.json](./form-template-seeds/document-1.json) |
| `document-2` | 휴가 인증서 | D | ✗ | [document-2.json](./form-template-seeds/document-2.json) |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서 | A | ✗ | [document-payment-order-pre-consent.json](./form-template-seeds/document-payment-order-pre-consent.json) |

단락 id 상세: [`issuance-form-seeds-backend-handoff.md`](./issuance-form-seeds-backend-handoff.md)  
**인증서 5종 (Payload D) 전 케이스:** [`certificate-form-seeds-backend-handoff.md`](./certificate-form-seeds-backend-handoff.md) — `document-2` 포함, 종별 `titleName`·실발급 매핑·`settingsJson` 전체 키

### 4.3 FE 목록 필터 (BE 참고)

FE는 발급 탭에서 **9종만** 렌더한다 (`ISSUANCE_FORM_LIST_TEMPLATE_CODES`).  
DB/API는 14종 전부 반환해도 되고, `useYn=false` 등으로 숨길 수 있다 — **단, FE가 merge할 때 templateCode 9종은 반드시 존재해야 한다.**

---

## 5. DB · API 구현 가이드

### 5.1 권장 테이블 구조 (개념)

```
form_template
  - template_id (PK)
  - template_code (UNIQUE, string SSOT)
  - template_name
  - form_type (WRITING | ISSUANCE)
  - category (REGISTRATION | RECRUITMENT | ... | ISSUANCE)
  - use_yn
  - seed_label (optional, e.g. form-template-fe-seed-v1)

form_template_version
  - template_version_id (PK)
  - template_id (FK)
  - version_no (= 1 for seed)
  - version_label (= 'v1 seed' or 'v1 local seed')
  - version_status (= DRAFT)
  - schema_json (TEXT / JSONB → API는 string)
  - extension_json (TEXT)
  - settings_json (TEXT, nullable)
  - response_count (= 0)
  - active_binding_count (= 0)
```

레포 실제 엔티티명·컬럼명은 BE 관례를 따르되, **OpenAPI `FormTemplateVersionResponse` 필드와 1:1**이어야 한다.

### 5.2 JSON → DB 변환 (의사코드)

```java
// 각 form-template-seeds/{templateCode}.json 파일
JsonNode seed = readJson("form-template-seeds/recruitment-instructor.json");

String schemaJsonStr = seed.get("schemaJson").isNull()
    ? null
    : objectMapper.writeValueAsString(seed.get("schemaJson"));

String extensionJsonStr = objectMapper.writeValueAsString(
    seed.get("extensionJson") != null ? seed.get("extensionJson") : emptyExtension()
);

String settingsJsonStr = seed.get("settingsJson") == null || seed.get("settingsJson").isNull()
    ? null
    : objectMapper.writeValueAsString(seed.get("settingsJson"));

// INSERT ... ON CONFLICT (template_code) DO UPDATE ...
```

**금지**

- JSON 파일 내 object를 다시 stringify해서 `\"{...}\"` 이중 escaping
- `schemaJson.paragraphs: []` 로 두고 Payload A 양식 시드 (FE `normalizeWritingFormDraftFromApi`가 보정하지만 API round-trip QA에서 불일치)
- Payload C에서 `extensionJson` 생략

### 5.3 Idempotency

| 키 | 값 |
|----|-----|
| `seedLabel` | `form-template-fe-seed-v1` |
| natural key | `templateCode` (string) |
| upsert | template + version 1 재실행 시 JSON 필드만 갱신, template_id 유지 |

### 5.4 목록 API 필수 필드 (P0)

[`forms-surveys-api-backend-gaps.md`](./forms-surveys-api-backend-gaps.md) §P0

| 필드 | FE 사용 |
|------|---------|
| `templateId` | number — version API·캐시 |
| `templateCode` | string — 라우트·localStorage 키 |
| `templateName` | 표시명 |
| `formType` | `WRITING` / `ISSUANCE` |
| `category` | 섹션 필터 |
| `latestVersionId` | **필수** — 에디터 진입 |
| `latestVersionStatus` | `DRAFT` |
| `availableActions` | `EDIT`, `PUBLISH` 등 |

### 5.5 저장 API (FE 2차 QA 전 확인)

FE는 DRAFT 저장 시 **`schemaJson` + `extensionJson` + `settingsJson`** 를 PUT body에 포함한다 (`admin-form-templates-service.ts`).

- `versionStatus !== DRAFT` 이면 409 또는 400
- optimistic lock / `updatedAt` 충돌 시 409 (FE 후속 대응 예정)

---

## 6. 시드 후 검증 (BE self-check)

### 6.1 API smoke

```bash
# 작성 33건
curl -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-templates?formType=WRITING&size=50"

# 발급 14건
curl -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-templates?formType=ISSUANCE&size=50"

# 대표 3종 version 상세 — paragraphs 비어 있지 않은지
for CODE in registration-general agreement-expense issuance-2; do
  VERSION_ID=$(... latestVersionId from list ...)
  curl -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/form-template-versions/$VERSION_ID"
done
```

### 6.2 JSON parity check

시드 파일 vs API 응답:

1. `jq -c .schemaJson form-template-seeds/registration-general.json`
2. API `schemaJson` string을 parse
3. deep equal (키 순서 무시)

대표 검증 5종: `registration-general`, `registration-ujat`(C), `agreement-expense`, `agreement-crime`(D), `document-3`(D)

### 6.2.1 인증서 5종 전수 (필수)

[`certificate-form-seeds-backend-handoff.md`](./certificate-form-seeds-backend-handoff.md) §7

```bash
for CODE in document-2 document-3 document-participation-certificate document-4 document-5; do
  # latestVersionId 조회 → schemaJson null, settingsJson.titleName 종별 일치, 키 13개+
done
```

- 5종 `settingsJson` 상호 공유·덮어쓰기 없음
- (P1) 종별 이미지 4필드 업로드 round-trip

### 6.3 FE 2차 QA (시드 완료 후 FE 팀)

[`form-template-fe-gap-report.md`](../qa/form-template-fe-gap-report.md) §BE 시딩 2차 QA 체크리스트

1. `.env`: `VITE_REAL_API_MODULES=...,formsSurveys`
2. 관리자 MFA 로그인
3. 42종 open → save → reopen (API round-trip)
4. `agreement-crime` 문서 이미지 CDN
5. 인증서 **5종** 이미지 업로드 → save → reopen (`document-2`~`5`, `document-participation-certificate`)

FE E2E: `cd apps/cms && pnpm test:e2e:templates:qa` (mock auth — API 전환 후 별도 API E2E 추가 예정)

---

## 7. BE 시딩 시 FE QA에서 확인된 갭 (우선 반영)

| 우선순위 | 항목 | templateCode | BE 시드 시 |
|----------|------|--------------|-----------|
| P0 | `latestVersionId` 목록 DTO | 전체 | 반드시 포함 |
| P0 | `extensionJson` 컬럼·PUT 지원 | Payload C 6종 | JSON 파일 그대로 |
| P1 | 성범죄 동의 기본 이미지 | `agreement-crime` | `settingsJson.documentImageUrl` CDN |
| P1 | 인증서 이미지 fileId/url | `document-2`~`5`, `document-participation-certificate` (**5종**) | [`certificate-form-seeds-backend-handoff.md`](./certificate-form-seeds-backend-handoff.md) |
| P2 | UJAT 희망 교육일 API | `application-ujat-school` | 시드와 별도 — 프로그램 일정 API |
| — | FE 버그 (시드 무관) | `recruitment-ujat-volunteer` | §8 |

---

## 8. 알려진 FE 버그 (시드와 무관)

| templateCode | 증상 | BE 영향 |
|--------------|------|---------|
| `recruitment-ujat-volunteer` | 양식 상세 진입 시 React infinite loop | 시드는 정상 삽입 가능. FE 수정 전까지 CMS에서 해당 양식 authoring 불가 |

---

## 9. 관련 문서

| 문서 | 용도 |
|------|------|
| [form-template-json-contract.md](./form-template-json-contract.md) | JSON·API 계약 SSOT |
| [forms-surveys-api-integration.md](./forms-surveys-api-integration.md) | 엔드포인트·모듈 키 |
| [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md) | FE PHASE 0–6 |
| [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) | 작성 시드 상세·단락 id |
| [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md) | 발급 시드 상세 |
| [certificate-form-seeds-backend-handoff.md](./certificate-form-seeds-backend-handoff.md) | **인증서 5종** Payload D·settingsJson·실발급 |
| [certificate-image-storage-handoff.md](./certificate-image-storage-handoff.md) | 인증서 이미지 |
| [form-template-document-download-backend-handoff.md](./form-template-document-download-backend-handoff.md) | 문서 PDF (별도 Epic) |
| [form-template-fe-gap-report.md](../qa/form-template-fe-gap-report.md) | FE 1차 QA·2차 체크리스트 |
| [form-template-management-manual-qa-checklist.md](../qa/form-template-management-manual-qa-checklist.md) | 수동 QA 표 |

---

## 10. 백엔드 Cursor 프롬프트

구현 지시를 그대로 붙여넣을 프롬프트:  
[`form-template-db-seed-backend-cursor-prompt.md`](./form-template-db-seed-backend-cursor-prompt.md)

---

_Last updated: 2026-09-02 · FE QA E2E 59/60 passed_
