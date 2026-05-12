import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
])

export const getAgreementNoticeA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = paragraph =>
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
