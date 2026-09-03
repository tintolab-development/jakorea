import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
])

/** A4 본문 compact — 패딩·갭 축소로 1페이지 수용 */
export const AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--agreement-portrait'

/** 본문 단락 간격(표·서문). closing 스택은 getAgreementClosingStackGapBefore 가 0 */
const PORTRAIT_A4_BODY_GAP_PX = 16

export const getAgreementPortraitA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS.has(paragraph.id)
    ? PORTRAIT_A4_BODY_GAP_PX
    : 12
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
