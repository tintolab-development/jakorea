import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  PAYMENT_STATEMENT_ISSUANCE_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'

export const PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
])

export const getPaymentStatementA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = () =>
  A4_DOCUMENT_PARAGRAPH_GAP_PX
