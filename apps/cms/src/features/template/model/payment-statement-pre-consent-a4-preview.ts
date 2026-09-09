import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'

export const PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
])

/**
 * 동의 표(p1~p4) | mid 확인·지급조서·최종 확인 으로 나눈다.
 */
export const PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS =
  new Set<string>([PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine])

export const getPaymentStatementPreConsentA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = A4_DOCUMENT_PARAGRAPH_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
