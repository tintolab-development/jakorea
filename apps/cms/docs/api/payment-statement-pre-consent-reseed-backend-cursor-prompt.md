# Cursor prompt — 지급조서 사전 동의서 DB 재시드 (시안 구분: mid/tail 확인·날짜·서명)

> **일괄 재시드(권장):** 동의 4종+발급 동시 적용은  
> [`agreement-consent-a4-sync-reseed-backend-cursor-prompt.md`](./agreement-consent-a4-sync-reseed-backend-cursor-prompt.md)  
> 본 문서는 지급조서 2종만 단독으로 재시드할 때 사용한다.

아래 지시를 **백엔드 레포**에서 실행하라. 질문은 기존 forms-surveys 시드 upsert 패턴을 찾아도 판단이 안 될 때만 하라.  
**시드 JSON SSOT는 프론트 레포**이다. 본 프롬프트에 없는 단락·문구를 임의로 작성하지 마라.

---

## Goal

시안처럼 **중간 확인 / 날짜 / 서명** 과 **최종 확인 / 날짜 / 서명** 이 schema 단락으로 **분리**되어 있도록  
다음 2개 templateCode 의 DRAFT `schemaJson`을 FE 시드와 **동일 내용**으로 upsert 재시드한다.

| templateCode | templateName | formType | category |
|--------------|--------------|----------|----------|
| `agreement-third-party` | 지급조서 사전 동의서 | `WRITING` | `AGREEMENT` |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서 | `DOCUMENT`(발급) | (시드 JSON 따름) |

완료 조건:

1. 각 templateCode 가 목록에 있고 `latestVersionId` 가 있다.
2. `GET /api/admin/form-template-versions/{latestVersionId}` 의 `schemaJson`(파싱 후)이 FE 시드와 **단락 id·순서·문구가 동일**하다.
3. `paragraphs.length === 15`
4. mid/tail **날짜·서명 단락이 각각 독립 id**로 존재한다 (합쳐진 단일 단락으로 만들지 마라).
5. 시드는 **idempotent** — `templateCode` natural key upsert. 중복 행을 만들지 마라.
6. **local/dev/staging** 전용. prod Flyway/마이그레이션에 넣지 마라.

---

## Out of scope / 금지

- 다른 templateCode 시드 변경 (초상권·교육진행자 등은 별도 프롬프트)
- schema 단락 id 변경·임의 문구 재작성
- midConsent+midDate+midSignature 를 하나로 merge 하는 BE 정규화
- Platform `form-responses` / 회원 filledDocument 일괄 마이그레이션 (별도 요청 없으면 스킵)
- PDF 생성 로직 변경

---

## SSOT (프론트 모노레포 `jakorea`)

```
apps/cms/docs/api/form-template-seeds/agreement-third-party.json
apps/cms/docs/api/form-template-seeds/document-payment-order-pre-consent.json
```

| 필드 | 값 |
|------|-----|
| Payload | **A** — `schemaJson` object + `extensionJson` 빈 object + `settingsJson: null` |
| 관계 | 두 JSON의 `schemaJson.paragraphs` 는 **동일** (templateCode·formType·category만 다름) |

**DB/API 저장:** `schemaJson` / `extensionJson` / `settingsJson` 각각 **JSON.stringify 1회** (이중 escaping 금지).

---

## 구현

1. 기존 form_template / form_template_version local seed·upsert 패턴을 재사용하라.
2. 위 FE JSON 을 읽어 각 `templateCode` 에 upsert.
3. version: `versionNo=1`(또는 기존 latest DRAFT 갱신), `versionStatus=DRAFT`, `versionLabel`은 기존 시드 규칙 유지.
4. §검증 curl 실행.

---

## 단락 요약 (검증용 · 15단락 · 시안 구분)

| # | id | kind / variant | 시안 역할 |
|---|----|----------------|-----------|
| 1 | `payment-statement-pre-consent-seed-title` | survey_title_with_period | 제목 |
| 2 | `payment-statement-pre-consent-seed-intro` | agreement_explanation_text | 서문 |
| 3 | `…-p1-collection` | horizontal_table | ① 개인정보 수집·이용 |
| 4 | `…-p2-rrn-collection` | horizontal_table | ② 고유식별번호 수집·이용 |
| 5 | `…-p3-third-party` | horizontal_table | ③ 제3자 제공·이용 |
| 6 | `…-p4-rrn-third-party` | horizontal_table | ④ 고유식별번호 제3자 제공 |
| 7 | `…-ja-korea-activity` | vertical_table | JA Korea 활동 경험 |
| 8 | `…-mid-consent-line` | agreement_explanation_text | **중간 확인 문구** (분리) |
| 9 | `…-mid-date` | system / `agreement_date` | **중간 날짜** `YYYY년 MM월 DD일` (분리) |
| 10 | `…-mid-signature` | system / `agreement_signature` | **중간 서명** `동의자 (서명)` (분리) |
| 11 | `…-payment-record` | vertical_table | 지급조서 기본정보 |
| 12 | `…-final-confirm` | agreement_explanation_text | **최종 확인 문구** (분리) |
| 13 | `…-tail-date` | system / `agreement_date` | **최종 날짜** (분리) |
| 14 | `…-tail-signature` | system / `agreement_signature` | **최종 서명** (분리) |
| 15 | `…-closing-recipient` | closing | `JA KOREA 귀하` |

전문·표 셀은 **반드시** FE JSON을 복사해 넣어라. 위 표만으로 재작성하지 마라.

### FE 렌더 참고 (BE는 schema만 맞추면 됨)

- **템플릿 편집(authoring):** mid/tail 날짜·서명을 **각각 system pill**로 표시 (시안과 동일).
- **회원 동의 fill:** FE가 mid/tail 날짜·서명을 숨기고 확인 문구와 합쳐 2단 카드로 표시. BE가 단락을 merge할 필요 없음.

---

## 검증 curl

```bash
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
# ADMIN_JWT 는 관리자 로그인+MFA 후 accessToken

for CODE in agreement-third-party document-payment-order-pre-consent; do
  echo "=== $CODE ==="
  curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
    "$API_BASE/api/admin/form-templates?size=100" \
    | jq --arg c "$CODE" '.data.content[]? // .content[]? | select(.templateCode==$c) | {templateCode, templateName, latestVersionId}'
done

# latestVersionId 를 넣고 단락 id·개수 확인
VID="<agreement-third-party latestVersionId>"
curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
  "$API_BASE/api/admin/form-template-versions/$VID" \
  | jq '{
      paragraphs: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs | length),
      midTailIds: (.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end | .paragraphs
        | map(select(.id|test("mid-|final-confirm|tail-|closing-recipient")) | .id))
    }'
```

기대값:

- `paragraphs` = `15`
- `midTailIds` =  
  `["payment-statement-pre-consent-seed-mid-consent-line","payment-statement-pre-consent-seed-mid-date","payment-statement-pre-consent-seed-mid-signature","payment-statement-pre-consent-seed-final-confirm","payment-statement-pre-consent-seed-tail-date","payment-statement-pre-consent-seed-tail-signature","payment-statement-pre-consent-seed-closing-recipient"]`
- `document-payment-order-pre-consent` 도 동일 `midTailIds` · `paragraphs=15`

FE JSON과 `jq -S` diff가 비어 있으면 완료.

---

## FE 교차 링크

- 시드: [`form-template-seeds/agreement-third-party.json`](./form-template-seeds/agreement-third-party.json) · [`document-payment-order-pre-consent.json`](./form-template-seeds/document-payment-order-pre-consent.json)
- 인덱스: [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md)
- draft factory: `createPaymentStatementPreConsentDraft()` (`@jakorea/form-schema`)
- 유사 프롬프트: [`agreement-expense-reseed-backend-cursor-prompt.md`](./agreement-expense-reseed-backend-cursor-prompt.md)
