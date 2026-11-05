import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import {
  LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL,
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
  titlePeriodEndDisplayText,
} from '@jakorea/form-schema/writing-form'
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayDateTimeRange,
  toSeoulDateOnly,
} from '@/shared/lib/format-display-date'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function resolveSurveyStartInstant(
  paragraph: TitleWithPeriodParagraph,
  surveyCreatedAt?: string | null,
): string {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  if (startMode === 'custom' && paragraph.startAt) return paragraph.startAt
  return surveyCreatedAt ?? new Date().toISOString()
}

/** 활동일 기준 익월 5일 (`YYYY-MM-DD`) */
function lectureReportEndDateOnly(activityInstant: string): string | null {
  const dateOnly = toSeoulDateOnly(activityInstant)
  if (!dateOnly) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly)
  if (!match) return null
  let year = Number(match[1])
  let month = Number(match[2]) + 1
  if (month > 12) {
    year += 1
    month = 1
  }
  return `${year}-${pad2(month)}-05`
}

function formatEndOfCalendarDay(dateOnly: string): string {
  const date = formatDisplayDate(dateOnly)
  return date ? `${date} 24:00` : ''
}

function resolveActivityRelativeEndLabel(
  paragraph: TitleWithPeriodParagraph,
  activityInstant: string,
): string | null {
  const preset = paragraph.endPeriodPresetLabel?.trim() ?? ''
  if (preset !== LECTURE_REPORT_END_ACTIVITY_PRESET_LABEL) return null
  const endDate = lectureReportEndDateOnly(activityInstant)
  if (!endDate) return null
  return formatEndOfCalendarDay(endDate) || null
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

  const activityEnd = resolveActivityRelativeEndLabel(paragraph, startRaw)
  if (activityEnd) {
    return `${start} ~ ${activityEnd}`
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
