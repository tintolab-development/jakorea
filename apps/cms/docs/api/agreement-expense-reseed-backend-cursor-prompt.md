# Cursor prompt — `agreement-expense` (교육진행자 동의 서약서) DB 재시드

> **일괄 재시드(권장):** 동의 4종+발급 동시 적용은  
> [`agreement-consent-a4-sync-reseed-backend-cursor-prompt.md`](./agreement-consent-a4-sync-reseed-backend-cursor-prompt.md)  
> 본 문서는 `agreement-expense`만 단독으로 재시드할 때 사용한다.

아래 지시를 **백엔드 레포**에서 실행하라. 질문은 기존 forms-surveys 시드 upsert 패턴을 찾아도 판단이 안 될 때만 하라.  
**시드 JSON SSOT는 프론트 레포**이다. 본 프롬프트에 없는 단락·문구를 임의로 작성하지 마라.

---

## Goal

`templateCode = agreement-expense` (교육진행자 동의 서약서) 의 DRAFT `schemaJson`을 FE 시드와 **동일 내용**으로 upsert 재시드한다.

완료 조건:

1. `GET /api/admin/form-templates?formType=WRITING` 목록에 `templateCode=agreement-expense`가 있고 `latestVersionId`가 있다.
2. `GET /api/admin/form-template-versions/{latestVersionId}` 의 `schemaJson`(파싱 후)이 FE 시드 `schemaJson`과 **단락 id·순서·문구·옵션 id가 동일**하다.
3. `paragraphs.length === 9`
4. `surveyTitle === "JA Korea 교육진행자 서약서(안)"`
5. 시드는 **idempotent** — `templateCode` natural key upsert. 중복 행을 만들지 마라.
6. **local/dev/staging** 전용. prod Flyway/마이그레이션에 넣지 마라.

---

## Out of scope / 금지

- 다른 templateCode 시드 변경
- schema 단락 id 변경·임의 문구 재작성
- Platform `form-responses` / 회원 filledDocument 운영 데이터 일괄 마이그레이션 (별도 요청 없으면 스킵)
- PDF 생성 로직 변경

---

## SSOT

프론트 모노레포 `jakorea` 경로:

```
apps/cms/docs/api/form-template-seeds/agreement-expense.json
```

| 필드 | 값 |
|------|-----|
| `templateCode` | `agreement-expense` |
| `templateName` | `교육진행자 동의 서약서` |
| `formType` | `WRITING` |
| `category` | `AGREEMENT` |
| Payload | **A** — `schemaJson` object + `extensionJson` 빈 object + `settingsJson: null` |

**DB/API 저장:** `schemaJson` / `extensionJson` / `settingsJson` 각각 **JSON.stringify 1회** (이중 escaping 금지).

---

## 구현

1. 기존 form_template / form_template_version local seed·upsert 패턴을 재사용하라.
2. FE `agreement-expense.json` 의 `schemaJson` · `extensionJson` · `settingsJson` 을 읽어 `templateCode=agreement-expense` 에 upsert.
3. version: `versionNo=1`(또는 기존 latest DRAFT 갱신), `versionStatus=DRAFT`, `versionLabel`은 기존 시드 규칙 유지 (`v1 seed` 또는 재시드 라벨).
4. §검증 curl 실행.

---

## 단락 요약 (검증용 · 9단락)

| # | id | kind / variant | 핵심 문구 |
|---|----|----------------|-----------|
| 1 | `agreement-expense-pledge-title` | description / survey_title_with_period | `surveyTitle`: **JA Korea 교육진행자 서약서(안)** |
| 2 | `agreement-expense-pledge-intro` | single_item / agreement_explanation_text | 본인은 JA Korea의 교육사업에 참여함에 있어, 다음 사항을 준수할 것을 서약합니다. |
| 3 | `agreement-expense-pledge-clause-1` | multiple_choice · required | 아동·청소년 보호와 성범죄 예방 — 옵션 `pledge-mc-1-agree` / `pledge-mc-1-disagree` |
| 4 | `agreement-expense-pledge-clause-2` | multiple_choice · required | 종교적 정치적 중립성 유지 — `pledge-mc-2-*` |
| 5 | `agreement-expense-pledge-clause-3` | multiple_choice · required | 개인정보 보호 — `pledge-mc-3-*` |
| 6 | `agreement-expense-pledge-clause-4` | multiple_choice · required | 품위 유지 및 성실한 교육 수행 — `pledge-mc-4-*` |
| 7 | `agreement-expense-pledge-violation-closing` | description / closing | 본 서약을 위반할 경우… 이에 동의합니다. |
| 8 | `agreement-expense-pledge-system-date` | system / agreement_date | 날짜 유형 |
| 9 | `agreement-expense-pledge-system-signature` | system / agreement_signature | 서명란 유형 |

조항 본문·closing 전문은 **반드시** `agreement-expense.json` 을 복사해 넣어라. 위 표만으로 재작성하지 마라.

---

## 검증 curl

```bash
# 1) 목록에서 agreement-expense + latestVersionId
curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
  "$API_BASE/api/admin/form-templates?formType=WRITING&size=50" \
  | jq '.content[] | select(.templateCode=="agreement-expense") | {templateCode, templateName, latestVersionId}'

# 2) version schemaJson 단락 수·제목·조항 id
VID="<latestVersionId>"
curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
  "$API_BASE/api/admin/form-template-versions/$VID" \
  | jq '{
      paragraphs: (.schemaJson | fromjson | .paragraphs | length),
      surveyTitle: (.schemaJson | fromjson | .paragraphs[0].surveyTitle),
      clauseIds: (.schemaJson | fromjson | .paragraphs[2:6] | map(.id)),
      clauseTitles: (.schemaJson | fromjson | .paragraphs[2:6] | map(.paragraphTitle))
    }'
```

기대값:

- `paragraphs` = `9`
- `surveyTitle` = `"JA Korea 교육진행자 서약서(안)"`
- `clauseIds` =  
  `["agreement-expense-pledge-clause-1","agreement-expense-pledge-clause-2","agreement-expense-pledge-clause-3","agreement-expense-pledge-clause-4"]`
- `clauseTitles` =  
  `["아동·청소년 보호와 성범죄 예방","종교적 정치적 중립성 유지","개인정보 보호","품위 유지 및 성실한 교육 수행"]`

FE JSON과 `jq -S` diff가 비어 있으면 완료.

---

## FE 교차 링크

- 시드 JSON: [`form-template-seeds/agreement-expense.json`](./form-template-seeds/agreement-expense.json)
- 작성 양식 인덱스: [`writing-form-seeds-backend-handoff.md`](./writing-form-seeds-backend-handoff.md)
- draft factory: `createEducatorFacilitatorPledgeDraft()` (`@jakorea/form-schema`)
