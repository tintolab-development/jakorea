import {
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import type { SurveySidecarState } from './survey-sidecar'

export type EducationSurveyFillValidation =
  | { ok: true }
  | { ok: false; message: string }

function isAnswerRequired(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    return paragraph.answerRequired === true || paragraph.requiredMark === true
  }
  return false
}

function extractSurveyParagraphAnswer(
  paragraph: WritingFormParagraph,
  sidecar: SurveySidecarState,
): unknown {
  if (paragraph.kind !== 'single_item') return undefined

  if (paragraph.variant === 'multiple_choice') {
    if (paragraph.allowMultiple === true) {
      return paragraph.selectedPreviewMultipleIds ?? []
    }
    return paragraph.selectedPreviewSingleId ?? null
  }

  if (paragraph.variant === 'scale_type') {
    return paragraph.selectedPreviewItemId ?? null
  }

  if (paragraph.variant === 'star_rate') {
    return paragraph.selectedPreviewStars ?? null
  }

  if (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') {
    const items = paragraph.items ?? []
    if (items.length === 0) return paragraph.bodyText ?? ''
    return {
      bodyText: paragraph.bodyText ?? '',
      items: items.map(item => ({ id: item.id, bodyText: item.bodyText ?? '' })),
    }
  }

  if (isUserInfoParagraph(paragraph)) {
    return paragraph.fieldAnswers ?? {}
  }

  if (paragraph.variant === 'date') {
    return sidecar.dateValues[paragraph.id] ?? ''
  }

  if (paragraph.variant === 'time') {
    return sidecar.timeValues[paragraph.id] ?? ''
  }

  if (paragraph.variant === 'file_attachment') {
    return sidecar.fileNames[paragraph.id] ?? null
  }

  if (paragraph.variant === 'vertical_table') {
    return {
      rows: paragraph.rows,
      bottomConsent: paragraph.showBottomConsent ? (paragraph.bottomConsent ?? null) : undefined,
    }
  }

  if (paragraph.variant === 'horizontal_table') {
    if (paragraph.showBottomConsent && paragraph.bottomConsent == null) return null
    return {
      fieldDataRows: paragraph.fieldDataRows ?? [],
      bottomConsent: paragraph.showBottomConsent ? paragraph.bottomConsent : undefined,
    }
  }

  if (paragraph.variant === 'agreement_explanation_text') {
    return paragraph.bodyText ?? ''
  }

  return undefined
}

function isEmptyAnswer(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('bodyText' in record || 'items' in record) {
      const body = typeof record.bodyText === 'string' ? record.bodyText.trim() : ''
      const items = Array.isArray(record.items) ? record.items : []
      const itemText = items.some(
        item =>
          item &&
          typeof item === 'object' &&
          typeof (item as { bodyText?: unknown }).bodyText === 'string' &&
          String((item as { bodyText: string }).bodyText).trim() !== '',
      )
      return !body && !itemText
    }
    return Object.keys(record).length === 0
  }
  return false
}

export function buildEducationSurveyAnswers(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState,
): Record<string, unknown> {
  const answers: Record<string, unknown> = {}
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind === 'description') continue
    const key = resolveApplicationAnswerKey(paragraph)
    if (!key) continue
    const value = extractSurveyParagraphAnswer(paragraph, sidecar)
    if (value !== undefined) answers[key] = value
  }
  return answers
}

export function validateEducationSurveyFill(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState,
): EducationSurveyFillValidation {
  for (const paragraph of draft.paragraphs) {
    if (!isAnswerRequired(paragraph) || isUserInfoParagraph(paragraph)) continue
    const value = extractSurveyParagraphAnswer(paragraph, sidecar)
    if (!isEmptyAnswer(value)) continue
    const title = paragraph.paragraphTitle?.trim() || '필수 문항'
    return { ok: false, message: `${title}에 답변해 주세요.` }
  }
  return { ok: true }
}

export function applyEducationSurveyAnswersToDraft(
  draft: WritingFormDraft,
  answers: Record<string, unknown> | null | undefined,
): WritingFormDraft {
  if (!answers || Object.keys(answers).length === 0) return draft
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      const key = resolveApplicationAnswerKey(paragraph)
      if (!key || !(key in answers)) return paragraph
      const value = answers[key]
      if (paragraph.kind !== 'single_item') return paragraph

      if (paragraph.variant === 'scale_type' && typeof value === 'string') {
        return { ...paragraph, selectedPreviewItemId: value }
      }
      if (paragraph.variant === 'star_rate' && typeof value === 'number') {
        return { ...paragraph, selectedPreviewStars: value }
      }
      if (paragraph.variant === 'multiple_choice') {
        if (typeof value === 'string') {
          return { ...paragraph, selectedPreviewSingleId: value }
        }
        if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
          return { ...paragraph, selectedPreviewMultipleIds: value }
        }
      }
      if (
        (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') &&
        typeof value === 'string'
      ) {
        const items =
          paragraph.items != null && paragraph.items.length > 0
            ? paragraph.items.map((item, index) =>
                index === 0 ? { ...item, bodyText: value } : item,
              )
            : paragraph.items
        return { ...paragraph, bodyText: value, items }
      }
      if (paragraph.variant === 'agreement_explanation_text' && typeof value === 'string') {
        return { ...paragraph, bodyText: value }
      }
      if (paragraph.variant === 'horizontal_table' && value && typeof value === 'object') {
        const record = value as { fieldDataRows?: unknown; bottomConsent?: unknown }
        return {
          ...paragraph,
          ...(Array.isArray(record.fieldDataRows)
            ? { fieldDataRows: record.fieldDataRows as typeof paragraph.fieldDataRows }
            : {}),
          ...(record.bottomConsent === 'agree' || record.bottomConsent === 'disagree'
            ? { bottomConsent: record.bottomConsent }
            : {}),
        }
      }
      if (isUserInfoParagraph(paragraph) && value && typeof value === 'object' && !Array.isArray(value)) {
        return { ...paragraph, fieldAnswers: value as Record<string, string> }
      }
      return paragraph
    }),
  }
}
