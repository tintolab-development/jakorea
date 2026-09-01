import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'

/** 카드 제목·A4 contentOnly 헤더 — CMS `paragraph-required-mark`와 동일 */
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
