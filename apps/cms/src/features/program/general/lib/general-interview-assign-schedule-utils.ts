import dayjs, { type Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralInterviewSlotListItem } from '@/features/program/general/api/admin-applications-service'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK, GENERAL_INTERVIEW_MOCK_RANGE } from '@/data/mock/general-volunteer-interview-schedule-mock'
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

  /** 면접 기간·슬롯 없는 날·토/일·지정 불가일 → 클릭 비활성(캘린더 opacity 0.5) */
  const disabledDate = (date: Dayjs) => !clickableDateKeys.has(date.format('YYYY-MM-DD'))

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

function timeRangeFromIso(startAt: string, endAt: string): string | null {
  const start = dayjs(startAt)
  const end = dayjs(endAt)
  if (!start.isValid() || !end.isValid()) return null
  return normalizeTimeRangeKey(`${start.format('HH:mm')} ~ ${end.format('HH:mm')}`)
}

/**
 * remote 면접 슬롯 목록 → 배정 캘린더 스케줄.
 * 슬롯이 비면 empty(클릭 불가) — empty-flash 방지용으로 호출부에서 loading 가드.
 */
export function parseGeneralInterviewScheduleFromRemoteSlots(
  slots: GeneralInterviewSlotListItem[]
): ParsedInterviewSchedule {
  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  let minDate: Dayjs | null = null
  let maxDate: Dayjs | null = null

  for (const slot of slots) {
    const dateKey = dayjs(slot.slotDate).isValid()
      ? dayjs(slot.slotDate).format('YYYY-MM-DD')
      : slot.slotDate
    const timeRange = timeRangeFromIso(slot.startAt, slot.endAt)
    if (!timeRange || !dateKey) continue

    const daySlots = slotsByDateKey.get(dateKey) ?? []
    const key = `${dateKey}|${timeRange}`
    if (!daySlots.some(existing => existing.key === key)) {
      daySlots.push({
        key,
        timeRange,
        displayTimeRange: formatDisplayTimeRange(timeRange),
      })
      slotsByDateKey.set(dateKey, daySlots)
    }
    clickableDateKeys.add(dateKey)

    const d = dayjs(dateKey)
    if (d.isValid()) {
      if (!minDate || d.isBefore(minDate, 'day')) minDate = d
      if (!maxDate || d.isAfter(maxDate, 'day')) maxDate = d
    }
  }

  const rangeStart = (minDate ?? dayjs()).startOf('month')
  const rangeEnd = (maxDate ?? dayjs()).endOf('month')

  /** 면접 슬롯이 없는 날(기간 외 포함) → 클릭 비활성 */
  const disabledDate = (date: Dayjs) => !clickableDateKeys.has(date.format('YYYY-MM-DD'))

  return {
    slotsByDateKey,
    clickableDateKeys,
    holidayDateKeys: new Set<string>(),
    disabledDate,
    rangeStart,
    rangeEnd,
    scheduleMonth: rangeStart.startOf('month'),
  }
}

/**
 * 면접 캘린더 가용 슬롯 표시 (remote OFF / GET 실패 폴백).
 * remote ON은 `parseGeneralInterviewScheduleFromRemoteSlots` + `listGeneralInterviewSlots`.
 * 배정 mutation은 `assignGeneralVolunteerInterview`(slot create + assign).
 */
export function parseGeneralInterviewScheduleFromProgram(program: Program): ParsedInterviewSchedule {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const hasSchedule =
    display.availableTimeSlots !== '-' ||
    display.recurringUnavailable !== '-' ||
    display.specificUnavailableDates !== '-'
  const scheduleSource = hasSchedule
    ? display
    : DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK
  const rangeStart = dayjs(GENERAL_INTERVIEW_MOCK_RANGE.startIso)
  const rangeEnd = dayjs(GENERAL_INTERVIEW_MOCK_RANGE.endIso)

  return buildParsedInterviewSchedule(
    {
      recurringUnavailable: scheduleSource.recurringUnavailable,
      specificUnavailableDates: scheduleSource.specificUnavailableDates,
      availableTimeSlots: scheduleSource.availableTimeSlots,
    },
    rangeStart,
    rangeEnd
  )
}
