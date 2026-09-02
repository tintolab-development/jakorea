import type {
  FormTitleNumberingStyle,
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'

function getTitleNumberSequenceIndex(
  paragraphs: WritingFormParagraph[],
  paragraphId: string,
): number | null {
  let n = 0
  for (const paragraph of paragraphs) {
    if (!paragraph.participatesInTitleNumbering) continue
    n += 1
    if (paragraph.id === paragraphId) return n
  }
  return null
}

function formatNumberToken(style: FormTitleNumberingStyle, sequence: number): string {
  if (style === 'none') return ''
  if (style === 'numeric') return `${sequence}`
  if (style === 'q123') return `Q${sequence}`
  if (style === 'q_repeat') return 'Q'
  return `${sequence}`
}

export function resolveEducationSurveySectionTitle(
  draft: WritingFormDraft,
  paragraph: WritingFormParagraph,
): string {
  const base = paragraph.paragraphTitle?.trim() ?? ''
  if (!base) return ''

  const style = draft.formSettings.titleNumbering
  if (!paragraph.participatesInTitleNumbering || style === 'none') {
    return base
  }

  const sequence = getTitleNumberSequenceIndex(draft.paragraphs, paragraph.id)
  if (sequence == null) return base

  const token = formatNumberToken(style, sequence)
  if (!token) return base

  return `${token}. ${base}`
}

export function resolveEducationSurveySectionRequired(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    return paragraph.answerRequired ?? paragraph.requiredMark
  }
  return paragraph.requiredMark
}
