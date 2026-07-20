import dayjs, { type Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import {
  formatDisplayTimeRange,
  getMockHolidayDateKeys,
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
  type InterviewAssignSlot,
  type ParsedInterviewSchedule,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

export type { InterviewAssignSlot, ParsedInterviewSchedule }

type GeneralInterviewScheduleSource = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
}

function parseTimeSlotsString(slotsString: string): string[] {
  return slotsString
    .split(',')
    .map(s => s.trim())
    .filter(slot => /\d{2}:\d{2}/.test(slot))
    .map(normalizeTimeRangeKey)
}

function parseUnavailableDateLabels(specificUnavailableDates: string): Set<string> {
  const keys = new Set<string>()
  for (const part of specificUnavailableDates.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const parsed = parseInterviewDisplayDateLabel(trimmed)
    if (parsed) keys.add(parsed.format('YYYY-MM-DD'))
  }
  return keys
}

function buildParsedInterviewSchedule(
  source: GeneralInterviewScheduleSource,
  rangeStart: Dayjs,
  rangeEnd: Dayjs
): ParsedInterviewSchedule {
  const commonSlots = parseTimeSlotsString(source.availableTimeSlots)
  const unavailableKeys = parseUnavailableDateLabels(source.specificUnavailableDates)
  const blockSaturday = source.recurringUnavailable.includes('토요일')
  const blockSunday = source.recurringUnavailable.includes('일요일')
  const includeHolidays = source.recurringUnavailable.includes('공휴일')
  const holidayDateKeys = includeHolidays ? getMockHolidayDateKeys() : new Set<string>()

  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  let cursor = rangeStart.startOf('day')
  while (!cursor.isAfter(rangeEnd, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    const isSaturday = blockSaturday && cursor.day() === 6
    const isSunday = blockSunday && cursor.day() === 0
    const isUnavailable = unavailableKeys.has(dateKey)

    if (!isSaturday && !isSunday && !isUnavailable && commonSlots.length > 0) {
      const slots: InterviewAssignSlot[] = commonSlots.map(timeRange => ({
        key: `${dateKey}|${timeRange}`,
        timeRange,
        displayTimeRange: formatDisplayTimeRange(timeRange),
      }))
      slotsByDateKey.set(dateKey, slots)
      clickableDateKeys.add(dateKey)
    }

    cursor = cursor.add(1, 'day')
  }

  const disabledDate = (date: Dayjs) => {
    if (date.isBefore(rangeStart, 'month') || date.isAfter(rangeEnd, 'month')) {
      return false
    }

    const dateKey = date.format('YYYY-MM-DD')
    if (blockSaturday && date.day() === 6) return true
    if (blockSunday && date.day() === 0) return true
    if (unavailableKeys.has(dateKey)) return true

    return !clickableDateKeys.has(dateKey)
  }

  return {
    slotsByDateKey,
    clickableDateKeys,
    holidayDateKeys,
    disabledDate,
    rangeStart,
    rangeEnd,
    scheduleMonth: rangeStart.startOf('month'),
  }
}

/**
 * 면접 캘린더 가용 슬롯 표시.
 * OpenAPI에 `GET …/interview-slots`가 없어 모집 표시 mock 기반 유지.
 * 배정 mutation은 `assignGeneralVolunteerInterview`(slot create + assign)로 remote 연동.
 */
export function parseGeneralInterviewScheduleFromProgram(program: Program): ParsedInterviewSchedule {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const rangeStart = dayjs('2026-03-01')
  const rangeEnd = dayjs('2026-03-31')

  return buildParsedInterviewSchedule(
    {
      recurringUnavailable: display.recurringUnavailable,
      specificUnavailableDates: display.specificUnavailableDates,
      availableTimeSlots: display.availableTimeSlots,
    },
    rangeStart,
    rangeEnd
  )
}
