# Cursor prompt — CMS 폼 양식 관리 47종 DB 시드

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 기존 forms-surveys 엔티티·시드 패턴을 찾아도 판단이 안 될 때만 하라.  
**시드 JSON SSOT는 프론트 레포** `apps/cms/docs/api/form-template-seeds/` 이다. 이 프롬프트에 없는 JSON 내용을 임의로 작성하지 마라.

---

## Goal

CMS LNB **양식 관리** (`/templates/form-management`)가 호출하는 `forms-surveys` API가 FE mock/localStorage 없이 동작하도록, **작성 33종 + 발급 14종 = 47 templateCode** 를 local/dev DB에 시드하라.

완료 조건:

1. 관리자 JWT로 `GET /api/admin/form-templates?formType=WRITING&size=50` 이 **33건**을 반환한다. 각 항목에 `templateCode`, `templateName`, `category`, **`latestVersionId`** 가 있다.
2. `GET /api/admin/form-templates?formType=ISSUANCE&size=50` 이 **14건**을 반환한다.
3. `GET /api/admin/form-template-versions/{latestVersionId}` 의 `schemaJson` / `extensionJson` / `settingsJson` 이 프론트 시드 JSON과 **동일한 내용**이다 (string 1회 stringify, 이중 escaping 없음).
4. `registration-general` version 조회 시 `schemaJson` 파싱 후 `paragraphs.length >= 6` 이다. **빈 paragraphs로 두지 마라.**
5. Payload C 6종(`registration-ujat`, `recruitment-ujat-school`, `recruitment-ujat-volunteer`, `application-ujat-school`, `application-ujat-volunteer`)은 `extensionJson` 이 시드 파일과 동일하다.
6. 시드는 **idempotent**. `seedLabel=form-template-fe-seed-v1`, natural key=`templateCode` 로 upsert. 재실행 시 47종이 중복되지 않는다.
7. **인증서 Payload D 5종** (`document-2`, `document-3`, `document-participation-certificate`, `document-4`, `document-5`) 전부 시드. 종별 `settingsJson` 독립. 상세: `certificate-form-seeds-backend-handoff.md`
8. **local/dev/staging** 전용. prod Flyway/마이그레이션에 넣지 마라.

---

## Out of scope / 금지

- Platform `form-responses/submit`, 프로그램 `form-bindings` 운영 데이터 생성
- schema JSON 내부 구조를 BE에서 재작성·단락 id 변경·필드 삭제
- iText/PDFBox 등으로 양식 PDF 생성 ([form-template-document-download-backend-handoff.md] — 별도 Epic)
- `issuance-5`, `issuance-1`, `document-1` 을 FE 목록에 강제 노출 (DB에는 시드하되 FE가 필터링)
- FE만 있는 `form-test-*` 테스트 템플릿
- prod 환경 시드

---

## SSOT — 시드 JSON 가져오기

프론트 레포 경로 (monorepo `jakorea`):

```
apps/cms/docs/api/form-template-seeds/*.json          # 46 files, 47 templates
apps/cms/docs/api/writing-form-seeds-backend-handoff.md
apps/cms/docs/api/issuance-form-seeds-backend-handoff.md
apps/cms/docs/api/form-template-json-contract.md
apps/cms/docs/api/certificate-form-seeds-backend-handoff.md  # 인증서 5종 Payload D SSOT
```

파일명 예외: `document-3-certificate.json` → `templateCode` = `document-3`

각 JSON 파일 구조:

```json
{
  "templateCode": "recruitment-instructor",
  "templateName": "공통_강사 모집 폼",
  "formType": "WRITING",
  "category": "RECRUITMENT",
  "schemaJson": { "...": "object — DB에는 JSON.stringify 1회" },
  "extensionJson": { "overlay": {}, "editorState": {}, "uiState": {} },
  "settingsJson": null
}
```

**DB/API 저장 규칙**

| 필드 | 저장 |
|------|------|
| `schemaJson` | object → `String` (한 번만). Payload D/E는 `null` 허용 |
| `extensionJson` | object → `String`. null 금지 — 최소 `{"overlay":{},"editorState":{},"uiState":{}}` |
| `settingsJson` | object → `String` 또는 SQL NULL |

---

## 구현 순서

1. `form_template`, `form_template_version` (또는 동등) 엔티티·Flyway/local seed 패턴을 찾아라. OpenAPI: `FormTemplateListItemResponse`, `FormTemplateVersionResponse`.
2. 기존 local dummy seed / `local` profile 패턴을 **재사용**하라. 새 프레임워크 만들지 마라.
3. 프론트 `form-template-seeds/` 46 JSON 파일을 읽어 **47 templateCode** 를 insert/upsert 하라.
4. template당 **version 1건**: `versionNo=1`, `versionStatus=DRAFT`, `versionLabel='v1 seed'`.
5. 목록 API가 `latestVersionId` 를 반환하는지 확인·없으면 매퍼/DTO 수정.
6. `PUT /api/admin/form-template-versions/{versionId}` 가 `extensionJson`, `settingsJson` 도 받·저장하는지 확인.
7. §검증 curl 실행.

---

## 고정 값

| 항목 | 값 |
|------|-----|
| seedLabel | `form-template-fe-seed-v1` |
| natural key | `templateCode` (string, UNIQUE) |
| versionNo | `1` |
| versionStatus | `DRAFT` |
| versionLabel | `v1 seed` |
| responseCount | `0` |
| activeBindingCount | `0` |
| useYn | `true` (또는 FE 필터와 합의된 값) |

---

## 47종 templateCode 목록 (복붙용)

### WRITING — 33

```
registration-general
registration-economy
registration-ujat
registration-trained-teachers
recruitment-instructor
recruitment-volunteer
recruitment-participant-school
recruitment-participant-individual
recruitment-economy
recruitment-gemini-visiting-training
recruitment-ujat-school
recruitment-ujat-volunteer
recruitment-trained-teachers
application-instructor
application-volunteer
application-participant-school
application-participant-individual
application-economy
application-gemini-visiting-training-instructor
application-gemini-visiting-training-school
application-ujat-school
application-ujat-volunteer
application-trained-teachers
survey-default
survey-student
survey-teacher
survey-admin
agreement-portrait
agreement-third-party
agreement-crime
agreement-notice
agreement-expense
```

### ISSUANCE — 14

```
issuance-1
issuance-2
issuance-ujat-edu-journal
issuance-3
issuance-4
issuance-5
document-payment-order-issue
document-payment-order-pre-consent
document-1
document-2
document-3
document-participation-certificate
document-4
document-5
```

---

## Payload 종류 (시드 파일 그대로)

| Payload | schemaJson | extensionJson | settingsJson | templateCode |
|---------|------------|---------------|--------------|--------------|
| A | paragraphs ≥ 1 | 빈 object OK | null | 대부분 |
| C | paragraphs ≥ 1 | **시드 overlay/editorState** | null | `registration-ujat`, `recruitment-ujat-*`, `application-ujat-*` |
| D | null 또는 paragraphs `[]` | 빈 object | **settingsJson (전체 키 13+)** | `agreement-crime`, **`document-2`**, `document-3`, `document-participation-certificate`, `document-4`, `document-5` |
| E | empty paragraphs | 빈 object | null | `issuance-1`, `issuance-5`, `document-1` |

---

## P1 — 시드 직후 BE가 추가로 할 일 (가능하면 같은 PR)

### 인증서 5종 — Payload D (필수 전수)

**SSOT:** `certificate-form-seeds-backend-handoff.md`

| templateCode | titleName | FE 목록 | 실발급 |
|--------------|-----------|---------|--------|
| `document-2` | 휴가 인증서 | ✗ | — |
| `document-3` | 수료증 | ☑ | 학생 수료 |
| `document-participation-certificate` | 참가인증서 | ☑ | 학생 참가 |
| `document-4` | 강사 활동 인증서 | ☑ | 강사 |
| `document-5` | 봉사 활동 인증서 | ☑ | 봉사자 |

`settingsJson` 필수 키: `orgLogo`, `orgLogo02`, `certificateBackground`, `chairmanSeal`, `titleName`, `bodyContent`, `chairmanName`, `orgAddress`, `orgPhone`, `orgFax`, `orgWebsite`, `participantInfo`, `participantRowVisibility`(length 6).  
시드 JSON: `form-template-seeds/document-*.json` (`document-3` → `document-3-certificate.json`).

5종 간 settings·이미지 **공유 금지**. 한 종 PUT이 다른 종에 영향 없어야 한다.

```bash
for CODE in document-2 document-3 document-participation-certificate document-4 document-5; do
  VID=$(curl -s -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/form-templates?formType=ISSUANCE&size=50" \
    | jq -r ".items[] | select(.templateCode==\"$CODE\") | .latestVersionId")
  curl -s -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/form-template-versions/$VID" \
    | jq -r '.schemaJson, (.settingsJson | fromjson | .titleName)'
done
# schemaJson=null, titleName=종별 표와 일치
```

### agreement-crime 기본 문서 이미지

- 프론트 기본 PNG: `apps/cms/src/assets/images/template/성범좌 경력 조회.png`
- 스토리지 업로드 후 `settingsJson`:

```json
{
  "documentImageUrl": "https://{cdn}/.../crime-consent-default.png",
  "replacementFileName": null
}
```

### 인증서 settingsJson (Payload D) — 5종

시드 파일 **전체 키** 그대로 DB insert. `orgLogo` 등 `null` = FE 기본 이미지.  
업로드 API: `certificate-image-storage-handoff.md` · 종별 독립성: `certificate-form-seeds-backend-handoff.md` §7

---

## 검증 (완료 전 필수)

```bash
ADMIN_JWT="..."
BASE="http://localhost:8080"   # BE base

# 1) 작성 33
curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-templates?formType=WRITING&size=50" | jq '.items | length'
# 기대: 33

# 2) 발급 14
curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-templates?formType=ISSUANCE&size=50" | jq '.items | length'
# 기대: 14

# 3) registration-general — paragraphs 비어 있지 않음
VID=$(curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-templates?formType=WRITING&size=50" \
  | jq -r '.items[] | select(.templateCode=="registration-general") | .latestVersionId')
curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  "$BASE/api/admin/form-template-versions/$VID" \
  | jq -r '.schemaJson' | jq '.paragraphs | length'
# 기대: >= 6

# 4) PUT round-trip (extensionJson)
curl -s -X PUT -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  "$BASE/api/admin/form-template-versions/$VID" \
  -d '{"versionLabel":"v1 seed smoke"}' | jq '.versionLabel'
```

FE 2차 QA (시드 배포 후): 프론트 `.env`에 `VITE_REAL_API_MODULES=formsSurveys` 추가 → CMS 양식 관리 42종 open/save/reopen.

---

## 알려진 FE 이슈 (시드 블로커 아님)

- `recruitment-ujat-volunteer`: CMS authoring 진입 시 React infinite loop (FE 수정 대기). 시드는 정상 삽입.

---

## 참고 문서 (프론트 레포)

- `apps/cms/docs/api/certificate-form-seeds-backend-handoff.md` — 인증서 5종
- `apps/cms/docs/api/form-template-db-seed-backend-handoff.md` — 전체 47종
- `apps/cms/docs/api/form-template-json-contract.md` — API JSON 계약
- `apps/cms/docs/qa/form-template-fe-gap-report.md` — FE 1차 QA·2차 체크리스트

---

_프롬프트 버전: form-template-fe-seed-v1 · 2026-09-02_
