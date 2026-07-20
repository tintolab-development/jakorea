import type {
  TableBottomConsent,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

function readParagraphBottomConsent(
  paragraph: WritingFormParagraph
): TableBottomConsent | undefined {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return undefined
  }
  return (paragraph as { bottomConsent?: TableBottomConsent }).bottomConsent
}

/** 동의 양식 — 하단 동의 선택이 있는 단락 중 미동의가 있으면 true */
export function hasMemberConsentDisagreement(draft: WritingFormDraft): boolean {
  return draft.paragraphs.some(paragraph => readParagraphBottomConsent(paragraph) === 'disagree')
}
