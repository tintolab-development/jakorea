import type {
  FormTitleNumberingStyle,
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { getSurveyWriteTitleNumberPrefix } from '@jakorea/form-schema/writing-form'

export function resolveEducationSurveySectionTitle(
  draft: WritingFormDraft,
  paragraph: WritingFormParagraph,
): string {
  const style: FormTitleNumberingStyle = draft.formSettings.titleNumbering
  const prefix = getSurveyWriteTitleNumberPrefix(
    draft.paragraphs,
    { paragraphId: paragraph.id },
    style,
  )

  const base = paragraph.paragraphTitle?.trim() ?? ''
  if (!base) return ''
  if (!paragraph.participatesInTitleNumbering || style === 'none') {
    return base
  }
  return prefix ? `${prefix}${base}` : base
}

export function resolveEducationSurveySectionRequired(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    return paragraph.answerRequired ?? paragraph.requiredMark
  }
  return paragraph.requiredMark
}
