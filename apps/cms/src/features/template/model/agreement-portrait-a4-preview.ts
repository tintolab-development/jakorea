import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import { AGREEMENT_PORTRAIT_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
])

/** A4 본문 compact — 패딩 축소로 1페이지 수용 */
export const AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--agreement-portrait'

/** 시안 1페이지 수용 — 단락 간 간격(공통 40px보다 축소) */
export const AGREEMENT_PORTRAIT_A4_SECTION_GAP_PX = 24

export const getAgreementPortraitA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) =>
  getAgreementClosingStackGapBefore(
    paragraph,
    index,
    pageParagraphs,
    AGREEMENT_PORTRAIT_A4_SECTION_GAP_PX
  )
