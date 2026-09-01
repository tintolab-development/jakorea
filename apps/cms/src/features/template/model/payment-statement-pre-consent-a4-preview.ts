import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'

export const PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
])

export const getPaymentStatementPreConsentA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
