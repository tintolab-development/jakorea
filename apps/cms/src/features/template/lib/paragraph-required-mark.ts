import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 카드 제목·A4 contentOnly 헤더 — authoring `paragraphEditableHeading`과 동일 기준 */
export function resolveParagraphTitleRequiredMark(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    if (paragraph.variant === 'horizontal_table') {
      return (paragraph as HorizontalTableParagraph).answerRequired
    }
    if (paragraph.variant === 'vertical_table') {
      return (paragraph as VerticalTableParagraph).answerRequired
    }
    return paragraph.answerRequired ?? paragraph.requiredMark
  }
  return paragraph.requiredMark
}

/**
 * 시드 단락 제목 필수(*) 강제.
 * `answerRequired`는 `single_item` 단락에만 있으므로, 그 외(`description` 등)는 `requiredMark`만 올린다.
 * — 제목 별표 판정(`resolveParagraphTitleRequiredMark`)도 비 `single_item`은 `requiredMark`를 읽는다.
 * 변경이 없으면 같은 참조를 그대로 돌려주므로 호출부는 `!==`로 변경 여부를 판단할 수 있다.
 */
export function forceParagraphTitleRequired(
  paragraph: WritingFormParagraph
): WritingFormParagraph {
  if (paragraph.kind === 'single_item') {
    if (paragraph.requiredMark === true && paragraph.answerRequired === true) return paragraph
    return { ...paragraph, requiredMark: true, answerRequired: true }
  }
  if (paragraph.requiredMark === true) return paragraph
  return { ...paragraph, requiredMark: true }
}
