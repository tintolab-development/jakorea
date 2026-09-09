import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  PAYMENT_STATEMENT_ISSUANCE_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'

export const PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
])

/**
 * 날짜·서명 closing 스택은 요소 margin(구분선 padding·날짜↔서명 10px)이 SSOT.
 * 스택 진입·내부 전환만 gap 0.
 */
export const getPaymentStatementA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph
) => {
  if (
    paragraph.id === PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate ||
    paragraph.id === PAYMENT_STATEMENT_ISSUANCE_IDS.closingSignature
  ) {
    return 0
  }
  return A4_DOCUMENT_PARAGRAPH_GAP_PX
}
