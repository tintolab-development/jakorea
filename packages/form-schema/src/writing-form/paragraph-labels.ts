import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from './draft-schema.js'
import { horizontalTableKindRowLabel, verticalTableKindRowLabel } from './paragraph-selectors.js'

export function paragraphKindLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    return horizontalTableKindRowLabel(p as HorizontalTableParagraph)
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    return verticalTableKindRowLabel(p as VerticalTableParagraph)
  }
  return '단일항목'
}
