import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
])

export const getAgreementNoticeA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const previous = index > 0 ? pageParagraphs[index - 1] : undefined
  if (
    paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing ||
    previous?.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing
  ) {
    return 0
  }
  const fallback = A4_DOCUMENT_PARAGRAPH_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
