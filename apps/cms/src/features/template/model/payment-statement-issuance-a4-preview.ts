import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  PAYMENT_STATEMENT_ISSUANCE_IDS,
  PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'

export const PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
])

export const getPaymentStatementA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = paragraph =>
  PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
