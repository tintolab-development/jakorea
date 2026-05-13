import type {
  HorizontalTableParagraph,
  MultipleChoiceParagraph,
  ScaleTypeParagraph,
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

export type DescriptionKindParagraph = Extract<WritingFormParagraph, { kind: 'description' }>

export function isShortEssayParagraph(
  p: WritingFormParagraph
): p is ShortEssayParagraph {
  return p.kind === 'single_item' && p.variant === 'short_essay'
}

export function isSessionPlanShortEssayParagraph(
  p: WritingFormParagraph
): p is SessionPlanShortEssayParagraph {
  return p.kind === 'single_item' && p.variant === 'session_plan_short_essay'
}

export function isShortEssayOrSessionPlanParagraph(
  p: WritingFormParagraph
): p is ShortEssayParagraph | SessionPlanShortEssayParagraph {
  return (
    p.kind === 'single_item' &&
    (p.variant === 'short_essay' || p.variant === 'session_plan_short_essay')
  )
}

export function isMultipleChoiceParagraph(
  p: WritingFormParagraph
): p is MultipleChoiceParagraph {
  return p.kind === 'single_item' && p.variant === 'multiple_choice'
}

export function isScaleTypeParagraph(p: WritingFormParagraph): p is ScaleTypeParagraph {
  return p.kind === 'single_item' && p.variant === 'scale_type'
}

export function isHorizontalTableParagraph(
  p: WritingFormParagraph
): p is HorizontalTableParagraph {
  return p.kind === 'single_item' && p.variant === 'horizontal_table'
}

export function isVerticalTableParagraph(
  p: WritingFormParagraph
): p is VerticalTableParagraph {
  return p.kind === 'single_item' && p.variant === 'vertical_table'
}

export function isDescriptionParagraph(
  p: WritingFormParagraph
): p is DescriptionKindParagraph {
  return p.kind === 'description'
}
