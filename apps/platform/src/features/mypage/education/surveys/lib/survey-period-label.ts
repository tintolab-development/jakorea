import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
} from '@jakorea/form-schema/writing-form'
import {
  formatDisplayDateParts,
  formatDisplayDateTime,
  formatDisplayDateTimeRange,
  toSeoulDisplayParts,
} from '@/shared/lib/format-display-date'

export type EducationSurveyPeriodLabelOptions = {
  /** 서버 effectiveDeadline Instant. 있으면 이 시각만 종료로 쓴다. FE에서 익월 5일을 계산하지 않는다. */
  submitDueAt?: string | null
}

function resolveSurveyStartInstant(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null,
): string {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  if (startMode === 'custom' && paragraph.startAt) return paragraph.startAt
  return surveyCreatedAt ?? new Date().toISOString()
}

function formatSubmitDueEndLabel(submitDueAt: string): string | null {
  const parts = toSeoulDisplayParts(submitDueAt)
  if (!parts) return formatDisplayDateTime(submitDueAt) || null
  if (parts.hour === 23 && parts.minute >= 59) {
    return `${formatDisplayDateParts(parts)} 24:00`
  }
  return formatDisplayDateTime(submitDueAt) || null
}

/** 설문 제목형 — 기간은 Platform `formatDisplayDate*` SSOT. 마감 없음은 종료 생략. */
export function resolveEducationSurveyPeriodLabel(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null,
  options?: EducationSurveyPeriodLabelOptions,
): string {
  const startRaw = resolveSurveyStartInstant(paragraph, surveyCreatedAt)
  const start = formatDisplayDateTime(startRaw) || startRaw.slice(0, 10)
  const endMode = resolveTitleEndPeriodMode(paragraph)

  if (endMode === 'immediate') {
    return `${start} ~`
  }

  const submitDueAt = options?.submitDueAt?.trim()
  if (submitDueAt) {
    const dueEnd = formatSubmitDueEndLabel(submitDueAt)
    if (dueEnd) return `${start} ~ ${dueEnd}`
  }

  if (paragraph.endPeriodPresetLabel?.trim()) {
    return `${start} ~ ${paragraph.endPeriodPresetLabel.trim()}`
  }

  if (paragraph.endAt) {
    const range = formatDisplayDateTimeRange(startRaw, paragraph.endAt)
    if (range) return range
  }

  return `${start} ~ ${titlePeriodEndDisplayText(paragraph)}`
}
