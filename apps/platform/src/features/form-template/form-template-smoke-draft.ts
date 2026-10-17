import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
} from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import {
  createVerticalTableParagraph,
  normalizeWritingFormDraft,
} from '@jakorea/form-schema/writing-form'

const PRE_CONSENT_TABLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty,
])

const VERTICAL_TABLE_SMOKE = createVerticalTableParagraph(
  'form-template-smoke-vertical-table',
  'text'
)

/** /design-system smoke test — 가로형 + 세로형 테이블 runtime */
export const FORM_TEMPLATE_SMOKE_DRAFT = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'numeric' },
  paragraphs: [
    ...createPaymentStatementPreConsentDraft().paragraphs.filter(p =>
      PRE_CONSENT_TABLE_IDS.has(p.id)
    ),
    {
      ...VERTICAL_TABLE_SMOKE,
      paragraphTitle: '커스텀 세로표',
      verticalChoiceOptions: ['A', 'B', 'C'],
      showBottomConsent: true,
      rows: [
        {
          stageCount: 2,
          headers: ['항목', '답변'],
          cells: ['', ''],
          stageKinds: ['text', 'subjective'],
        },
        {
          stageCount: 1,
          headers: ['첨부'],
          cells: [''],
          stageKinds: ['file_attachment'],
        },
        {
          stageCount: 1,
          headers: ['선택'],
          cells: [''],
          stageKinds: ['single_choice'],
        },
      ],
    },
  ],
})
