import type {
  FormTitleNumberingStyle,
  UserInfoFieldEntry,
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  formatUserInfoWriteQuestionTitle,
  getSurveyWriteTitleNumberPrefix,
} from '@jakorea/form-schema/writing-form'

export function resolveEducationSurveySectionTitle(
  draft: WritingFormDraft,
  paragraph: WritingFormParagraph,
  userInfoField?: UserInfoFieldEntry,
): string {
  const style: FormTitleNumberingStyle = draft.formSettings.titleNumbering
  const slot =
    userInfoField != null
      ? { paragraphId: paragraph.id, fieldKey: userInfoField.key }
      : { paragraphId: paragraph.id }
  const prefix = getSurveyWriteTitleNumberPrefix(draft.paragraphs, slot, style)

  if (userInfoField != null) {
    const base = formatUserInfoWriteQuestionTitle(userInfoField.label)
    return prefix ? `${prefix}${base}` : base
  }

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
