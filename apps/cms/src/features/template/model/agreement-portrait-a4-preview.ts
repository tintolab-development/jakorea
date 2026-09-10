import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import { AGREEMENT_PORTRAIT_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
])

/** A4 본문 compact — 패딩 축소로 1페이지 수용 (단락 간격은 A4_DOCUMENT_PARAGRAPH_GAP_PX) */
export const AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--agreement-portrait'

export const getAgreementPortraitA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) =>
  getAgreementClosingStackGapBefore(
    paragraph,
    index,
    pageParagraphs,
    A4_DOCUMENT_PARAGRAPH_GAP_PX
  )
