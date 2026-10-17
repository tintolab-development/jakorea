import dayjs, { type Dayjs } from 'dayjs'
import type { TitleWithPeriodParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  resolveTitleEndPeriodMode,
  resolveTitleStartPeriodMode,
} from '@/features/template/lib/title-with-period-settings'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'

/** 기간 피커 `value` — 비어 있으면 null(오늘 자동 주입 방지) */
export function resolveSurveyTitleWritingPeriodPickerValue(
  paragraph: TitleWithPeriodParagraph
): Dayjs | null {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  const endMode = resolveTitleEndPeriodMode(paragraph)
  if (startMode === 'custom' && paragraph.startAt) {
    const d = dayjs(paragraph.startAt)
    if (d.isValid()) return d
  }
  if (endMode === 'custom' && paragraph.endAt) {
    const d = dayjs(paragraph.endAt)
    if (d.isValid()) return d
  }
  return null
}

/** 시작·종료 모두 직접 설정일 때만 듀얼 트리거에 확정 구간 표시 */
export function resolveSurveyTitleWritingPeriodAppliedSurfaceRange(
  paragraph: TitleWithPeriodParagraph
): [Dayjs, Dayjs] | null {
  const startMode = resolveTitleStartPeriodMode(paragraph)
  const endMode = resolveTitleEndPeriodMode(paragraph)
  if (startMode !== 'custom' || endMode !== 'custom') return null

  const start = paragraph.startAt ? dayjs(paragraph.startAt) : null
  const end = paragraph.endAt ? dayjs(paragraph.endAt) : null
  if (!start?.isValid() || !end?.isValid()) return null

  return start.isAfter(end) ? [end, start] : [start, end]
}

export function resolveSurveyTitleWritingPeriodAppliedWithTime(
  range: [Dayjs, Dayjs]
): boolean {
  return dateRangeUsesClockTime(range[0], range[1])
}

export function patchSurveyTitleWritingPeriodCustomRange(
  paragraph: TitleWithPeriodParagraph,
  range: [Dayjs, Dayjs],
  withTime: boolean
): TitleWithPeriodParagraph {
  const [a, b] = range[0].isAfter(range[1]) ? [range[1], range[0]] : range
  const startIso = withTime ? a.toISOString() : a.startOf('day').toISOString()
  const endIso = withTime ? b.toISOString() : b.endOf('day').toISOString()
  return {
    ...paragraph,
    startPeriodMode: 'custom',
    endPeriodMode: 'custom',
    startAt: startIso,
    endAt: endIso,
    startPeriodPresetLabel: null,
    endPeriodPresetLabel: null,
    periodMode: 'custom',
  }
}

export function patchSurveyTitleWritingPeriodCustomEndDate(
  paragraph: TitleWithPeriodParagraph,
  end: Dayjs,
  withTime = false
): TitleWithPeriodParagraph {
  return {
    ...paragraph,
    endPeriodMode: 'custom',
    endAt: withTime ? end.toISOString() : end.endOf('day').toISOString(),
    endPeriodPresetLabel: null,
    periodMode:
      resolveTitleStartPeriodMode(paragraph) === 'custom' || paragraph.startAt
        ? 'custom'
        : paragraph.periodMode,
  }
}

export function patchSurveyTitleWritingPeriodCustomStartDate(
  paragraph: TitleWithPeriodParagraph,
  start: Dayjs,
  withTime = false
): TitleWithPeriodParagraph {
  return {
    ...paragraph,
    startPeriodMode: 'custom',
    startAt: withTime ? start.toISOString() : start.startOf('day').toISOString(),
    startPeriodPresetLabel: null,
    periodMode:
      resolveTitleEndPeriodMode(paragraph) === 'custom' || paragraph.endAt
        ? 'custom'
        : paragraph.periodMode,
  }
}
