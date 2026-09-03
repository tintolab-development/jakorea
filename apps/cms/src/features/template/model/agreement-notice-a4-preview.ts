import {
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

/**
 * - title: A4 헤더와 중복
 * - confirmationClosing: 본문 빈 단락(구분선 전용). A4에서 숨기고 날짜 단락에 상단 구분선을 둔다.
 */
export const AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
])

export const getAgreementNoticeA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const previous = index > 0 ? pageParagraphs[index - 1] : undefined
  if (
    paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate ||
    previous?.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate
  ) {
    return 0
  }
  const fallback = AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
