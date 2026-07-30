import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
} from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { normalizeWritingFormDraft } from '@jakorea/form-schema/writing-form'

const PRE_CONSENT_TABLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty,
])

/** /test smoke test — 지급조서 사전 동의서 p1~p3 (가로형 테이블) */
export const FORM_TEMPLATE_SMOKE_DRAFT = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'numeric' },
  paragraphs: createPaymentStatementPreConsentDraft().paragraphs.filter(p =>
    PRE_CONSENT_TABLE_IDS.has(p.id)
  ),
})
