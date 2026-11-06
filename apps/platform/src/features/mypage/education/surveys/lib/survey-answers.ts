import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type LectureReportProgramProgressParagraph,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import { PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH } from '@/features/program/lib/portal-application-free-text'
import type { SurveySidecarState } from './survey-sidecar'

export type EducationSurveyFillValidation =
  | { ok: true }
  | { ok: false; message: string; incomplete?: 'file_attachment' }

function isAnswerRequired(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    return paragraph.answerRequired === true || paragraph.requiredMark === true
  }
  return false
}

function extractSurveyParagraphAnswer(
  paragraph: WritingFormParagraph,
  sidecar: SurveySidecarState
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
    const next: Record<string, string> = {}
    for (const field of getUserInfoSelectedEntries(paragraph)) {
      const value = paragraph.fieldAnswers?.[field.key]?.trim() ?? ''
      if (value !== '') next[field.key] = value
    }
    return next
  }

  if (paragraph.variant === 'date') {
    return sidecar.dateValues[paragraph.id] ?? ''
  }

  if (paragraph.variant === 'time') {
    return sidecar.timeValues[paragraph.id] ?? ''
  }

  if (paragraph.variant === 'file_attachment') {
    return sidecar.fileNames[paragraph.id] ?? []
  }

  if (paragraph.variant === 'lecture_report_program_progress') {
    const progress = paragraph as LectureReportProgramProgressParagraph
    return {
      programName: progress.programName,
      textbookName: progress.textbookName,
      progressUnit: progress.progressUnit,
      institutionName: progress.institutionName,
      institutionLocation: progress.institutionLocation,
      educationDate: progress.educationDate,
      sessionTime: progress.sessionTime,
      sessionIndex: progress.sessionIndex,
      educationTarget: progress.educationTarget,
      classLabel: progress.classLabel,
      studentCount: progress.studentCount,
    }
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

function surveyFreeTextLength(value: unknown): number {
  if (typeof value === 'string') return value.length
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  const record = value as Record<string, unknown>
  let total = typeof record.bodyText === 'string' ? record.bodyText.length : 0
  if (Array.isArray(record.items)) {
    for (const item of record.items) {
      if (item && typeof item === 'object' && typeof (item as { bodyText?: unknown }).bodyText === 'string') {
        total += (item as { bodyText: string }).bodyText.length
      }
    }
  }
  if (Array.isArray(record.fieldDataRows)) {
    for (const row of record.fieldDataRows) {
      if (!row || typeof row !== 'object') continue
      for (const cell of Object.values(row as Record<string, unknown>)) {
        if (typeof cell === 'string') total += cell.length
      }
    }
  }
  return total
}

function isEmptyAnswer(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const progressKeys = [
      'programName',
      'textbookName',
      'progressUnit',
      'institutionName',
      'institutionLocation',
      'educationDate',
      'sessionTime',
      'sessionIndex',
      'educationTarget',
      'classLabel',
      'studentCount',
    ]
    if (progressKeys.some(key => key in record)) {
      return progressKeys.every(key => typeof record[key] !== 'string' || record[key].trim() === '')
    }
    if ('bodyText' in record || 'items' in record) {
      const body = typeof record.bodyText === 'string' ? record.bodyText.trim() : ''
      const items = Array.isArray(record.items) ? record.items : []
      const itemText = items.some(
        item =>
          item &&
          typeof item === 'object' &&
          typeof (item as { bodyText?: unknown }).bodyText === 'string' &&
          String((item as { bodyText: string }).bodyText).trim() !== ''
      )
      return !body && !itemText
    }
    return Object.values(record).every(item => typeof item !== 'string' || item.trim() === '')
  }
  return false
}

export function buildEducationSurveyAnswers(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState
): Record<string, unknown> {
  const answers: Record<string, unknown> = {}
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind === 'description') continue
    if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') continue
    const key = resolveApplicationAnswerKey(paragraph)
    if (!key) continue
    const value = extractSurveyParagraphAnswer(paragraph, sidecar)
    if (value === undefined) continue
    answers[key] = value
  }
  return answers
}

export function validateEducationSurveyFill(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState,
  options?: {
    fileObjectIdsByQuestion?: Record<string, number[]>
    minimumFilesPerAttachment?: number
    requireUserInfoAnswers?: boolean
    /** 공개 설문 등 — 지정 key만 필수 (단락 answerRequired와 무관) */
    requiredUserInfoFieldKeys?: readonly string[]
  }
): EducationSurveyFillValidation {
  for (const paragraph of draft.paragraphs) {
    if (isUserInfoParagraph(paragraph)) {
      if (!options?.requireUserInfoAnswers) continue
      const explicitRequiredKeys = options.requiredUserInfoFieldKeys
      if (explicitRequiredKeys != null && explicitRequiredKeys.length > 0) {
        const entries = getUserInfoSelectedEntries(paragraph)
        const entryByKey = new Map(entries.map(entry => [entry.key, entry]))
        for (const key of explicitRequiredKeys) {
          const field = entryByKey.get(key)
          if (field == null) continue
          if ((paragraph.fieldAnswers?.[key] ?? '').trim() === '') {
            return { ok: false, message: `${field.label}을 입력해 주세요.` }
          }
        }
        continue
      }
      if (!isAnswerRequired(paragraph)) continue
      for (const field of getUserInfoSelectedEntries(paragraph)) {
        if ((paragraph.fieldAnswers?.[field.key] ?? '').trim() === '') {
          return { ok: false, message: `${field.label}을 입력해 주세요.` }
        }
      }
      continue
    }
    const valueForLength = extractSurveyParagraphAnswer(paragraph, sidecar)
    if (surveyFreeTextLength(valueForLength) > PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH) {
      return {
        ok: false,
        message: '입력 가능한 글자 수를 초과했습니다. 1,000자 이하로 작성해 주세요.',
      }
    }
    if (!isAnswerRequired(paragraph)) continue
    if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
      const questionKey = resolveApplicationAnswerKey(paragraph)
      const fileCount =
        options?.fileObjectIdsByQuestion != null
          ? (options.fileObjectIdsByQuestion[questionKey]?.length ?? 0)
          : (sidecar.fileNames[paragraph.id]?.length ?? 0)
      const minimum = options?.minimumFilesPerAttachment ?? 1
      if (fileCount < minimum) {
        const title = paragraph.paragraphTitle?.trim() || '교육 사진'
        return {
          ok: false,
          incomplete: 'file_attachment',
          message: `${title}을(를) ${minimum}장 이상 첨부해 주세요.`,
        }
      }
      continue
    }
    const value = extractSurveyParagraphAnswer(paragraph, sidecar)
    if (!isEmptyAnswer(value)) continue
    const title = paragraph.paragraphTitle?.trim() || '필수 문항'
    return { ok: false, message: `${title}에 답변해 주세요.` }
  }
  return { ok: true }
}

export function applyEducationSurveyAnswersToDraft(
  draft: WritingFormDraft,
  answers: Record<string, unknown> | null | undefined
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
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const record = value as { bodyText?: unknown; items?: unknown }
        const answerItems = Array.isArray(record.items) ? record.items : []
        const items =
          answerItems.length > 0
            ? paragraph.items?.map((item, index) => {
                const answerItem = answerItems[index]
                return answerItem &&
                  typeof answerItem === 'object' &&
                  typeof (answerItem as { bodyText?: unknown }).bodyText === 'string'
                  ? { ...item, bodyText: (answerItem as { bodyText: string }).bodyText }
                  : item
              })
            : paragraph.items
        return {
          ...paragraph,
          ...(typeof record.bodyText === 'string' ? { bodyText: record.bodyText } : {}),
          items,
        }
      }
      if (
        (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') &&
        typeof value === 'string'
      ) {
        const items =
          paragraph.items != null && paragraph.items.length > 0
            ? paragraph.items.map((item, index) =>
                index === 0 ? { ...item, bodyText: value } : item
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
      if (
        paragraph.variant === 'lecture_report_program_progress' &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const progress = value as Partial<LectureReportProgramProgressParagraph>
        return {
          ...paragraph,
          ...Object.fromEntries(
            [
              'programName',
              'textbookName',
              'progressUnit',
              'institutionName',
              'institutionLocation',
              'educationDate',
              'sessionTime',
              'sessionIndex',
              'educationTarget',
              'classLabel',
              'studentCount',
            ].map(key => [
              key,
              typeof progress[key as keyof LectureReportProgramProgressParagraph] === 'string'
                ? progress[key as keyof LectureReportProgramProgressParagraph]
                : paragraph[key as keyof LectureReportProgramProgressParagraph],
            ])
          ),
        } as WritingFormParagraph
      }
      if (
        isUserInfoParagraph(paragraph) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return { ...paragraph, fieldAnswers: value as Record<string, string> }
      }
      return paragraph
    }),
  }
}
