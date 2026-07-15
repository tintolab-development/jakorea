# 발급 양식 시드 JSON — 백엔드 전달 (14종)

`formType=ISSUANCE` 초기 DRAFT / DB 시드용입니다. FE mock factory에서 생성했습니다.

**관련**

- JSON 계약: [form-template-json-contract.md](./form-template-json-contract.md) §8
- API 후속: [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md)
- 카탈로그 SSOT: `src/features/template/api/form-template-catalog.ts` → `ISSUANCE_TEMPLATE_CODE_CATALOG`
- 생성: `exportIssuanceFormTemplateSeeds()` (`export-writing-form-template-seeds.ts`)

## 저장 규칙

| 필드 | 설명 |
|------|------|
| `schemaJson` | Payload **A**: `WritingFormDraft` object → API 저장 시 **JSON string**. Payload **D**: `null`. Payload **E**: 빈 paragraphs object |
| `extensionJson` | `{ overlay, editorState, uiState }` → JSON string (기본 빈 object) |
| `settingsJson` | Payload **D**(인증서)만 사용. 그 외 `null` |
| `formType` | 항상 `ISSUANCE` |
| `category` | 시드 JSON은 `ISSUANCE` (FE 목록 서브분류 REPORT/DOCUMENT는 `_feSubcategoryNote` 참고) |

### Payload 종류

| 코드 | body |
|------|------|
| **A** | `schemaJson` + 빈 `extensionJson`, `settingsJson: null` |
| **D** | `schemaJson: null` + `settingsJson` (인증서 5종) |
| **E** | 빈 `schemaJson.paragraphs` — FE 편집기 없음. 메타/빈 DRAFT만 |

## 목록 (14종)

### 보고 양식 (6)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `issuance-1` | UJAT 결과리포트 | E | [issuance-1.json](./form-template-seeds/issuance-1.json) | 0 |
| `issuance-2` | UJAT 교육계획서 | A | [issuance-2.json](./form-template-seeds/issuance-2.json) | 7 |
| `issuance-ujat-edu-journal` | UJAT 교육일지 | A | [issuance-ujat-edu-journal.json](./form-template-seeds/issuance-ujat-edu-journal.json) | 10 |
| `issuance-3` | 강의보고서 | A | [issuance-3.json](./form-template-seeds/issuance-3.json) | 6 |
| `issuance-4` | 정산 신청서 | A | [issuance-4.json](./form-template-seeds/issuance-4.json) | 5 |
| `issuance-5` | 결과보고서 | E | [issuance-5.json](./form-template-seeds/issuance-5.json) | 0 |

### 서류 양식 (8)

| templateCode | templateName | Payload | 시드 JSON | 단락 수 |
|--------------|--------------|---------|-----------|--------:|
| `document-payment-order-issue` | 지급조서(발급용) | A | [document-payment-order-issue.json](./form-template-seeds/document-payment-order-issue.json) | 7 |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서 | A | [document-payment-order-pre-consent.json](./form-template-seeds/document-payment-order-pre-consent.json) | 14 |
| `document-1` | 지출증빙서류(필수폼) | E | [document-1.json](./form-template-seeds/document-1.json) | 0 |
| `document-2` | 휴가 인증서 | D | [document-2.json](./form-template-seeds/document-2.json) | 0 |
| `document-3` | 수료증 | D | [document-3-certificate.json](./form-template-seeds/document-3-certificate.json) | 0 |
| `document-participation-certificate` | 참여인증서 | D | [document-participation-certificate.json](./form-template-seeds/document-participation-certificate.json) | 0 |
| `document-4` | 강사 활동 인증서 | D | [document-4.json](./form-template-seeds/document-4.json) | 0 |
| `document-5` | 봉사 활동 인증서 | D | [document-5.json](./form-template-seeds/document-5.json) | 0 |

## 단락 id 요약 (Payload A)

### `issuance-2` — UJAT 교육계획서

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-edu-plan-title` | description | survey_title_with_period |  |
| `ujat-edu-plan-explanation-text` | single_item | agreement_explanation_text |  |
| `ujat-edu-plan-volunteer-info` | single_item | user_info | 봉사자 정보 |
| `ujat-edu-plan-session-1` | single_item | session_plan_short_essay | 1차시 교육 계획 |
| `ujat-edu-plan-session-2` | single_item | session_plan_short_essay | 2차시 교육 계획 |
| `ujat-edu-plan-session-3` | single_item | session_plan_short_essay | 3차시 교육 계획 |
| `ujat-edu-plan-session-4` | single_item | session_plan_short_essay | 4차시 교육 계획 |

### `issuance-ujat-edu-journal` — UJAT 교육일지

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `ujat-edu-journal-title` | description | survey_title_with_period |  |
| `ujat-edu-journal-explanation-text` | single_item | agreement_explanation_text |  |
| `ujat-edu-journal-volunteer-info` | single_item | user_info | 봉사자 정보 |
| `ujat-edu-journal-education-info` | single_item | ujat_journal_education_info | 교육 정보 |
| `ujat-edu-journal-session-1` | single_item | session_plan_short_essay | 1차시 교육 일지 |
| `ujat-edu-journal-session-2` | single_item | session_plan_short_essay | 2차시 교육 일지 |
| `ujat-edu-journal-session-3` | single_item | session_plan_short_essay | 3차시 교육 일지 |
| `ujat-edu-journal-session-4` | single_item | session_plan_short_essay | 4차시 교육 일지 |
| `ujat-edu-journal-content-feedback` | single_item | short_essay | 교육 내용 피드백 |
| `ujat-edu-journal-education-photos` | single_item | file_attachment | 교육 사진 |

### `issuance-3` — 강의보고서

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `lecture-report-title` | description | survey_title_with_period |  |
| `lecture-report-program-progress` | single_item | lecture_report_program_progress | 프로그램 진행 정보 |
| `lecture-report-education-content` | single_item | session_plan_short_essay | 교육 내용 |
| `lecture-report-education-operation` | single_item | session_plan_short_essay | 교육 운영 |
| `lecture-report-overall-evaluation` | single_item | session_plan_short_essay | 강의 종합 평가 및 개선점 |
| `lecture-report-education-photos` | single_item | file_attachment | 교육 사진 |

### `issuance-4` — 정산 신청서

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `settlement-application-seed-title` | description | survey_title_with_period |  |
| `settlement-application-seed-table-basic` | single_item | horizontal_table | 기본 정보 |
| `settlement-application-seed-table-calc-info` | single_item | horizontal_table | 강의비 산출 내역 |
| `settlement-application-seed-table-transport` | single_item | horizontal_table | 교통비 신청 |
| `settlement-application-seed-table-accommodation` | single_item | horizontal_table | 숙박비 신청 |

### `document-payment-order-issue` — 지급조서(발급용)

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `payment-statement-seed-title` | description | survey_title_with_period |  |
| `payment-statement-seed-table-basic` | single_item | horizontal_table | 지급조서 |
| `payment-statement-seed-table-calc-info` | single_item | horizontal_table | 강의비 산출 정보 |
| `payment-statement-seed-table-calc-lines` | single_item | horizontal_table | 강의비 산출 내역 |
| `payment-statement-seed-table-work-log` | single_item | horizontal_table | 근무일지 |
| `payment-statement-seed-closing-date` | description | closing |  |
| `payment-statement-seed-closing-signature` | description | closing |  |

### `document-payment-order-pre-consent` — 지급조서 사전 동의서

> 작성 agreement-third-party와 동일 schema, templateCode·formType만 분리.

| id | kind | variant | paragraphTitle |
|----|------|---------|----------------|
| `payment-statement-pre-consent-seed-title` | description | survey_title_with_period |  |
| `payment-statement-pre-consent-seed-intro` | single_item | agreement_explanation_text | 개인정보 수집‧이용 및 제공 동의서 |
| `payment-statement-pre-consent-seed-p1-collection` | single_item | horizontal_table | 개인정보 수집‧이용 |
| `payment-statement-pre-consent-seed-p2-rrn-collection` | single_item | horizontal_table | 고유식별번호(주민등록번호) 수집·이용 |
| `payment-statement-pre-consent-seed-p3-third-party` | single_item | horizontal_table | 개인정보 제3자 제공·이용 |
| `payment-statement-pre-consent-seed-p4-rrn-third-party` | single_item | horizontal_table | 고유식별번호 제3자 제공·이용 |
| `payment-statement-pre-consent-seed-mid-consent-line` | single_item | agreement_explanation_text |  |
| `payment-statement-pre-consent-seed-mid-date` | description | system | 날짜 유형 |
| `payment-statement-pre-consent-seed-mid-signature` | description | system | 서명란 유형 |
| `payment-statement-pre-consent-seed-payment-record` | single_item | vertical_table | 지급조서 |
| `payment-statement-pre-consent-seed-final-confirm` | single_item | agreement_explanation_text |  |
| `payment-statement-pre-consent-seed-tail-date` | description | system | 날짜 유형 |
| `payment-statement-pre-consent-seed-tail-signature` | description | system | 서명란 유형 |
| `payment-statement-pre-consent-seed-closing-recipient` | description | closing |  |

## Payload D · E 참고

- **D (인증서 5종):** `settingsJson.titleName` / `bodyContent` / `participantRowVisibility` 시드. 이미지 필드는 `null`.
- **E (3종):** `issuance-1`, `issuance-5`, `document-1` — 제품 스펙 확정 전까지 빈 DRAFT.

---

_Generated from FE draft factories (`exportIssuanceFormTemplateSeeds`)._
