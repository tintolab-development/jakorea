import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
])

export const getAgreementPortraitA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = paragraph =>
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
