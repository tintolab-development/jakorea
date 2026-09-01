import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_EXPENSE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
])

export const getAgreementExpenseA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
