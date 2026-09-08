import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  SETTLEMENT_APPLICATION_ISSUANCE_IDS,
} from '@/features/template/model/settlement-application-issuance-draft'

export const SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
])

export const getSettlementApplicationA4ParagraphGap: FormDocumentPreviewParagraphGapResolver =
  () => A4_DOCUMENT_PARAGRAPH_GAP_PX
