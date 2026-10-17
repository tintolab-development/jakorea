import type { WritingFormDraft, WritingFormParagraph } from './draft-schema.js'

/** CMS 미리보기·시드에 박힌 하단 동의 라디오 */
export function clearWritingFormParagraphBottomConsent(
  paragraph: WritingFormParagraph,
): WritingFormParagraph {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return paragraph
  }
  return { ...paragraph, bottomConsent: undefined }
}

/** 객관식(단일·다중) 미리보기 선택값 */
export function clearWritingFormParagraphMultipleChoice(
  paragraph: WritingFormParagraph,
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
    return paragraph
  }
  return {
    ...paragraph,
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function clearHorizontalTableIdTypeWithInput(
  paragraph: WritingFormParagraph,
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
    return paragraph
  }
  const nested = paragraph.idTypeWithInput
  if (nested == null) return paragraph
  return {
    ...paragraph,
    idTypeWithInput: {
      ...nested,
      selectedOptionId: null,
      inputValue: '',
    },
  }
}

function clearScaleAndStarPreview(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item') return paragraph
  if (paragraph.variant === 'scale_type') {
    return { ...paragraph, selectedPreviewItemId: null }
  }
  if (paragraph.variant === 'star_rate') {
    return { ...paragraph, selectedPreviewStars: null }
  }
  return paragraph
}

/** 양식 작성(fill) 초기 진입 — 구조는 유지하고 사용자 응답·미리보기 선택만 비운다 */
export function clearWritingFormParagraphFillPreviewAnswers(
  paragraph: WritingFormParagraph,
): WritingFormParagraph {
  let next = clearWritingFormParagraphBottomConsent(paragraph)
  next = clearWritingFormParagraphMultipleChoice(next)
  next = clearHorizontalTableIdTypeWithInput(next)
  next = clearScaleAndStarPreview(next)
  return next
}

export function clearWritingFormFillPreviewAnswers(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(clearWritingFormParagraphFillPreviewAnswers),
  }
}
