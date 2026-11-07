import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
  /** 5번 하단 열람·보유기간 안내 — 편집(C09)·Platform 작성(P5)에만 있고 A4 미리보기(C10)에는 없음 */
  AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote,
])

/** A4 본문 스코프 — 행정정보 공동이용 사전동의서 전용 미리보기 CSS */
export const AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--agreement-notice'

/** 시안 1페이지 수용 — 단락 간 간격(공통 40px보다 축소) */
export const AGREEMENT_NOTICE_A4_SECTION_GAP_PX = 24

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
  const fallback = AGREEMENT_NOTICE_A4_SECTION_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
