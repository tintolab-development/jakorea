import dayjs from 'dayjs'
import type { FormPeriodMode, TitleWithPeriodParagraph } from './draft-schema.js'

function formatDisplayDate(value: dayjs.Dayjs): string {
  if (!value.isValid()) return ''
  const y = value.year()
  const m = String(value.month() + 1).padStart(2, '0')
  const d = String(value.date()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export function isTitleWithPeriodParagraph(
  p: { kind?: string; variant?: string } | null | undefined
): p is TitleWithPeriodParagraph {
  return p?.kind === 'description' && p.variant === 'survey_title_with_period'
}

export function resolveTitleStartPeriodMode(paragraph: TitleWithPeriodParagraph): FormPeriodMode {
  if (paragraph.startPeriodMode != null) return paragraph.startPeriodMode
  if (paragraph.startAt) return 'custom'
  return paragraph.periodMode === 'custom' ? 'custom' : 'immediate'
}

export function resolveTitleEndPeriodMode(paragraph: TitleWithPeriodParagraph): FormPeriodMode {
  if (paragraph.endPeriodMode != null) return paragraph.endPeriodMode
  if (paragraph.endAt || paragraph.endPeriodPresetLabel) return 'custom'
  return paragraph.periodMode === 'custom' ? 'custom' : 'immediate'
}

function formatEndClock(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  return d.format('HH:mm')
}

export function titlePeriodStartDisplayText(paragraph: TitleWithPeriodParagraph): string {
  if (resolveTitleStartPeriodMode(paragraph) === 'immediate') return '바로 시작'
  if (paragraph.startAt) {
    const d = dayjs(paragraph.startAt)
    if (d.isValid()) return formatDisplayDate(d)
  }
  return '바로 시작'
}

export function titlePeriodEndDisplayText(paragraph: TitleWithPeriodParagraph): string {
  if (resolveTitleEndPeriodMode(paragraph) === 'immediate') return '마감 없음'
  if (paragraph.endPeriodPresetLabel?.trim()) return paragraph.endPeriodPresetLabel.trim()
  if (paragraph.endAt) {
    const d = dayjs(paragraph.endAt)
    if (!d.isValid()) return '마감 없음'
    const date = formatDisplayDate(d)
    const atMidnight =
      d.hour() === 0 && d.minute() === 0 && d.second() === 0 && d.millisecond() === 0
    if (atMidnight) return date
    return `${date} (${formatEndClock(paragraph.endAt)})`
  }
  return '마감 없음'
}

export function normalizeTitleWithPeriodParagraph(
  paragraph: TitleWithPeriodParagraph
): TitleWithPeriodParagraph {
  const startPeriodMode = resolveTitleStartPeriodMode(paragraph)
  const endPeriodMode = resolveTitleEndPeriodMode(paragraph)
  return {
    ...paragraph,
    startPeriodMode,
    endPeriodMode,
    startAt: startPeriodMode === 'immediate' ? null : paragraph.startAt,
    endAt: endPeriodMode === 'immediate' ? null : paragraph.endAt,
    endPeriodPresetLabel:
      endPeriodMode === 'immediate' ? null : (paragraph.endPeriodPresetLabel ?? null),
    periodMode:
      startPeriodMode === 'custom' || endPeriodMode === 'custom' ? 'custom' : 'immediate',
  }
}
