# Cursor prompt — 동의 양식 4종(+지급조서 발급) DB 재시드 (A4·시안 동기화)

아래 지시를 **백엔드 레포**에서 실행하라. 질문은 기존 forms-surveys 시드 upsert 패턴을 찾아도 판단이 안 될 때만 하라.  
**시드 JSON SSOT는 프론트 레포**이다. 본 프롬프트에 없는 단락·문구를 임의로 작성하지 마라.

---

## Goal

CMS 동의 양식 **작성(A4 미리보기) ↔ FE 시드 ↔ DB `schemaJson`** 이 어긋나지 않도록  
아래 templateCode 들의 latest **DRAFT** `schemaJson`을 FE 시드와 **동일 내용**으로 upsert 재시드한다.

| templateCode | templateName | formType | category | 기대 `paragraphs.length` | FE 시드 |
|--------------|--------------|----------|----------|-------------------------:|---------|
| `agreement-expense` | 교육진행자 동의 서약서 | `WRITING` | `AGREEMENT` | **9** | `agreement-expense.json` |
| `agreement-notice` | 행정정보 공동이용 사전동의서 | `WRITING` | `AGREEMENT` | **9** | `agreement-notice.json` |
| `agreement-portrait` | 초상권 수집·이용 동의 | `WRITING` | `AGREEMENT` | **8** | `agreement-portrait.json` |
| `agreement-third-party` | 지급조서 사전 동의서 | `WRITING` | `AGREEMENT` | **15** | `agreement-third-party.json` |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서 | `DOCUMENT`(발급) | (시드 JSON 따름) | **15** | `document-payment-order-pre-consent.json` |

완료 조건:

1. 각 `templateCode`가 목록에 있고 `latestVersionId`가 있다.
2. `GET /api/admin/form-template-versions/{latestVersionId}` 의 `schemaJson`(파싱 후)이 해당 FE 시드와 **단락 id·순서·문구·표 셀·옵션 id가 동일**하다.
3. 위 표의 `paragraphs.length`를 만족한다.
4. **확인 문구 / 날짜 / 서명**이 schema에서 **분리된 독립 단락**이다 (BE가 mid·tail·closing+date+signature를 하나로 merge 하지 마라).
5. 지급조서 2종(`agreement-third-party`, `document-payment-order-pre-consent`)의 `schemaJson.paragraphs`는 **서로 동일**하다 (templateCode·formType·category만 다름).
6. 시드는 **idempotent** — `templateCode` natural key upsert. 중복 행을 만들지 마라.
7. **local/dev/staging** 전용. prod Flyway/마이그레이션에 넣지 마라.

---

## Why (FE 측 배경 · BE는 schema만 맞추면 됨)

A4 미리보기에서 구 DB draft가 남아 있으면:

- 지급조서: **중간 확인·날짜·서명 / JA Korea 활동 경험**이 빠지거나, p1 표가 구버전으로 남아 시안과 불일치
- 초상권·행정·서약: **확인(closing) + `system` 날짜 + `system` 서명** 3단락이 없거나 merge 되어 서명란이 안 보임

FE는 authoring/A4에서 날짜·서명을 **분리 렌더**하고, 회원 fill에서만 2단 확인 카드로 합친다.  
`JA KOREA 귀하`·`작성완료` 버튼은 **FE 푸터**이며 schema에 넣지 마라  
(지급조서만 seed에 `…-closing-recipient`가 있고, FE는 이를 숨긴 뒤 공통 푸터로 대체).

---

## Out of scope / 금지

- `agreement-crime` 및 그 외 templateCode 시드 변경
- schema 단락 id 변경·임의 문구·표 행 재작성
- mid/tail 또는 closing+date+signature 를 **단일 단락으로 merge** 하는 BE 정규화
- Platform `form-responses` / 회원 `filledDocument` 일괄 마이그레이션 (별도 요청 없으면 스킵)
- PDF 생성 로직·FE 렌더 옵션(`agreementClosingFooter` 등) 변경
- prod 환경 시드

---

## SSOT (프론트 모노레포 `jakorea`)

```
apps/cms/docs/api/form-template-seeds/agreement-expense.json
apps/cms/docs/api/form-template-seeds/agreement-notice.json
apps/cms/docs/api/form-template-seeds/agreement-portrait.json
apps/cms/docs/api/form-template-seeds/agreement-third-party.json
apps/cms/docs/api/form-template-seeds/document-payment-order-pre-consent.json
```

| 필드 | 값 |
|------|-----|
| Payload | **A** — `schemaJson` object + `extensionJson` 빈 object + `settingsJson: null` (`agreement-crime` 제외) |
| 저장 | `schemaJson` / `extensionJson` / `settingsJson` 각각 **JSON.stringify 1회** (이중 escaping 금지) |

인덱스: [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md)  
계약: [`form-template-json-contract.md`](./form-template-json-contract.md)

---

## 구현

1. 기존 form_template / form_template_version local seed·upsert 패턴을 재사용하라.
2. 위 5개 FE JSON을 읽어 각 `templateCode`에 upsert.
3. version: `versionNo=1`(또는 기존 latest DRAFT 갱신), `versionStatus=DRAFT`, `versionLabel`은 기존 시드 규칙 유지 (예: `v1 seed` / 재시드 라벨).
4. §검증 curl 실행 후 FE JSON과 `jq -S` diff가 비면 완료.

권장 `seedLabel`(환경에 맞게): `agreement-consent-a4-sync-reseed-2026-09`

---

## 단락 요약 (검증용 · 전문은 JSON 복사)

### 1) `agreement-expense` — 9단락

| # | id | variant / preset | 시안 역할 |
|---|----|------------------|-----------|
| 1 | `agreement-expense-pledge-title` | survey_title_with_period | 제목 (`surveyTitle`: JA Korea 교육진행자 서약서(안)) |
| 2 | `agreement-expense-pledge-intro` | agreement_explanation_text | 서문 |
| 3–6 | `…-clause-1` … `…-clause-4` | multiple_choice | 조항 1–4 + 동의/동의하지 않음 |
| 7 | `…-violation-closing` | closing | 위반 시 자격 제한 인지 동의 |
| 8 | `…-system-date` | system / `agreement_date` | **날짜 (분리)** |
| 9 | `…-system-signature` | system / `agreement_signature` | **서명 (분리)** |

### 2) `agreement-notice` — 9단락

| # | id | variant / preset | 시안 역할 |
|---|----|------------------|-----------|
| 1 | `agreement-notice-title` | survey_title_with_period | 제목 |
| 2 | `agreement-notice-institution` | agreement_explanation_text | 이용기관 명칭 |
| 3 | `agreement-notice-purpose` | agreement_explanation_text | 이용사무(이용목적) |
| 4 | `agreement-notice-table` | horizontal_table | 공동이용 행정정보 |
| 5 | `agreement-notice-consent-static` | static_description_lines | 정보주체 동의사항 |
| 6 | `agreement-notice-subject` | short_essay | 대상자 본인 |
| 7 | `agreement-notice-confirmation-closing` | closing | 확인 문구 |
| 8 | `agreement-notice-system-date` | system / `agreement_date` | **날짜 (분리)** |
| 9 | `agreement-notice-system-signature` | system / `agreement_signature` | **서명 (분리)** |

### 3) `agreement-portrait` — 8단락

| # | id | variant / preset | 시안 역할 |
|---|----|------------------|-----------|
| 1 | `agreement-portrait-title` | survey_title_with_period | 제목 |
| 2 | `agreement-portrait-intro` | agreement_explanation_text | 서문 |
| 3 | `…-personal-consent-table` | vertical_table | 개인정보·초상권 수집·이용 |
| 4 | `…-delegated-consent-table` | vertical_table | 처리위탁 |
| 5 | `…-usage-table` | vertical_table | 초상권 제공·이용 |
| 6 | `agreement-portrait-confirmation-closing` | closing | 확인 문구 |
| 7 | `agreement-portrait-system-date` | system / `agreement_date` | **날짜 (분리)** |
| 8 | `agreement-portrait-system-signature` | system / `agreement_signature` | **서명 (분리)** |

### 4) `agreement-third-party` / `document-payment-order-pre-consent` — 15단락 (동일 paragraphs)

| # | id | variant / preset | 시안 역할 |
|---|----|------------------|-----------|
| 1 | `payment-statement-pre-consent-seed-title` | survey_title_with_period | 제목 |
| 2 | `…-intro` | agreement_explanation_text | 서문 |
| 3 | `…-p1-collection` | horizontal_table | ① 개인정보 수집·이용 (**1회만**, 중복 행 금지) |
| 4 | `…-p2-rrn-collection` | horizontal_table | ② 고유식별번호 수집·이용 |
| 5 | `…-p3-third-party` | horizontal_table | ③ 제3자 제공·이용 |
| 6 | `…-p4-rrn-third-party` | horizontal_table | ④ 고유식별번호 제3자 제공 |
| 7 | `…-ja-korea-activity` | vertical_table | ⑤ JA Korea 활동 경험 (**필수**) |
| 8 | `…-mid-consent-line` | agreement_explanation_text | **중간 확인 (분리)** |
| 9 | `…-mid-date` | system / `agreement_date` | **중간 날짜 (분리)** |
| 10 | `…-mid-signature` | system / `agreement_signature` | **중간 서명 (분리)** |
| 11 | `…-payment-record` | vertical_table | 지급조서 |
| 12 | `…-final-confirm` | agreement_explanation_text | **최종 확인 (분리)** |
| 13 | `…-tail-date` | system / `agreement_date` | **최종 날짜 (분리)** |
| 14 | `…-tail-signature` | system / `agreement_signature` | **최종 서명 (분리)** |
| 15 | `…-closing-recipient` | closing | `JA KOREA 귀하` (schema 유지 · FE가 푸터로 대체) |

전문·표 셀·옵션은 **반드시** FE JSON을 복사해 넣어라. 위 표만으로 재작성하지 마라.

---

## 검증 curl

```bash
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
# ADMIN_JWT = 관리자 로그인(+MFA) accessToken

CODES=(
  agreement-expense
  agreement-notice
  agreement-portrait
  agreement-third-party
  document-payment-order-pre-consent
)

for CODE in "${CODES[@]}"; do
  echo "=== $CODE ==="
  curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
    "$API_BASE/api/admin/form-templates?size=100" \
    | jq --arg c "$CODE" '
        (.data.content // .content // [])[]
        | select(.templateCode==$c)
        | {templateCode, templateName, formType, latestVersionId}
      '
done

# schemaJson 파싱 헬퍼 (응답이 { data: … } 또는 flat 모두)
# 사용: VID=... 후 아래 jq 블록 실행

schema_len_and_tail() {
  local VID="$1"
  curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
    "$API_BASE/api/admin/form-template-versions/$VID" \
    | jq '{
        paragraphs: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs | length),
        surveyTitle: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs[0].surveyTitle // null),
        allIds: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs | map(.id)),
        tailIds: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs[-3:] | map(.id))
      }'
}

schema_payment_mid_tail() {
  local VID="$1"
  curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
    "$API_BASE/api/admin/form-template-versions/$VID" \
    | jq '{
        paragraphs: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs | length),
        midTailIds: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs
          | map(select(.id|test("ja-korea-activity|mid-|final-confirm|tail-|closing-recipient")) | .id)),
        p1Count: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs
          | map(select(.id=="payment-statement-pre-consent-seed-p1-collection")) | length)
      }'
}

# 예:
# schema_len_and_tail "<agreement-expense latestVersionId>"
# schema_len_and_tail "<agreement-notice latestVersionId>"
# schema_len_and_tail "<agreement-portrait latestVersionId>"
# schema_payment_mid_tail "<agreement-third-party latestVersionId>"
# schema_payment_mid_tail "<document-payment-order-pre-consent latestVersionId>"
```

### 기대값

| templateCode | paragraphs | 핵심 id 체크 |
|--------------|-----------:|--------------|
| `agreement-expense` | 9 | `tailIds` = `…-violation-closing`, `…-system-date`, `…-system-signature` / `surveyTitle` = `"JA Korea 교육진행자 서약서(안)"` |
| `agreement-notice` | 9 | `tailIds` = `…-confirmation-closing`, `…-system-date`, `…-system-signature` |
| `agreement-portrait` | 8 | `tailIds` = `…-confirmation-closing`, `…-system-date`, `…-system-signature` |
| `agreement-third-party` | 15 | `midTailIds` 7개(활동경험+mid×3+final+tail×2+귀하), `p1Count` = `1` |
| `document-payment-order-pre-consent` | 15 | 위와 **동일** `midTailIds` · `p1Count=1` |

FE JSON과 version `schemaJson`의 `jq -S` diff가 비어 있으면 완료.

---

## FE 교차 링크

- 시드 디렉터리: [`form-template-seeds/`](./form-template-seeds/)
- 작성 양식 인덱스: [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md)
- 단건 프롬프트(참고·본 문서가 상위):
  - [`agreement-expense-reseed-backend-cursor-prompt.md`](./agreement-expense-reseed-backend-cursor-prompt.md)
  - [`payment-statement-pre-consent-reseed-backend-cursor-prompt.md`](./payment-statement-pre-consent-reseed-backend-cursor-prompt.md)
- draft factory (`@jakorea/form-schema`):
  - `createEducatorFacilitatorPledgeDraft()`
  - `createAgreementNoticeDraft()`
  - `createAgreementPortraitDraft()`
  - `createPaymentStatementPreConsentDraft()`
- FE overlay(구 draft 보강, DB 재시드와 병행):  
  `overlayPaymentStatementPreConsentSeedHorizontalTables` — **DB SSOT를 FE와 맞추는 것이 본 작업의 목적**. overlay만으로 끝내지 마라.
