import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  SETTLEMENT_APPLICATION_ISSUANCE_IDS,
  SETTLEMENT_APPLICATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/settlement-application-issuance-draft'

export const SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
])

export const getSettlementApplicationA4ParagraphGap: FormDocumentPreviewParagraphGapResolver =
  paragraph =>
    SETTLEMENT_APPLICATION_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
