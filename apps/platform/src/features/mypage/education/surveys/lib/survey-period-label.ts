import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
} from '@jakorea/form-schema/writing-form'
import { formatDisplayDateTime, formatDisplayDateTimeRange } from '@/shared/lib/format-display-date'

function resolveSurveyStartInstant(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null,
): string {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  if (startMode === 'custom' && paragraph.startAt) return paragraph.startAt
  return surveyCreatedAt ?? new Date().toISOString()
}

/** 설문 제목형 — 기간은 Platform `formatDisplayDate*` SSOT. 마감 없음은 종료 생략. */
export function resolveEducationSurveyPeriodLabel(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null,
): string {
  const startRaw = resolveSurveyStartInstant(paragraph, surveyCreatedAt)
  const start = formatDisplayDateTime(startRaw) || startRaw.slice(0, 10)
  const endMode = resolveTitleEndPeriodMode(paragraph)

  if (endMode === 'immediate') {
    return `${start} ~`
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
