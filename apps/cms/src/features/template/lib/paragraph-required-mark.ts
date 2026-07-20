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
