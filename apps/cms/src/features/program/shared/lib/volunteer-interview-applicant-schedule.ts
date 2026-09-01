import dayjs, { type Dayjs } from 'dayjs'
import { DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK } from '@/data/mock/general-volunteer-interview-schedule-mock'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import { getMockHolidayDateKeys } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

export type VolunteerInterviewTimeSlotOption = {
  key: string
  label: string
  /** 관리자(모집 폼)가 신청 가능으로 연 시간대 */
  enabled: boolean
}

export type ParsedVolunteerInterviewApplicantSchedule = {
  clickableDateKeys: Set<string>
  disabledDate: (date: Dayjs) => boolean
  scheduleMonth: Dayjs
  rangeStart: Dayjs
  rangeEnd: Dayjs
  slotsForDate: (dateKey: string) => VolunteerInterviewTimeSlotOption[]
}

type InterviewTimeUnit = VolunteerInterviewScheduleEditSeed['timeUnit']

function buildDayjsTimeRange(
  range: VolunteerInterviewScheduleEditSeed['interviewTimeRange']
): [Dayjs, Dayjs] {
  const base = dayjs().startOf('day')
  const start = base.hour(range.startHour).minute(range.startMinute).second(0)
  const end = base.hour(range.endHour).minute(range.endMinute).second(0)
  return [start, end]
}

export function buildVolunteerInterviewTimeSlots(
  range: [Dayjs, Dayjs] | null,
  unit: InterviewTimeUnit
): VolunteerInterviewTimeSlotOption[] {
  if (range == null) return []

  const [start, end] = range
  const minutes = Number(unit)
  const slots: VolunteerInterviewTimeSlotOption[] = []
  let cursor = start

  while (slots.length < 96) {
    const next = cursor.add(minutes, 'minute')
    if (next.isAfter(end)) break

    const label = `${cursor.format('HH:mm')} ~ ${next.format('HH:mm')}`
    slots.push({
      key: `${cursor.valueOf()}-${next.valueOf()}`,
      label,
      enabled: true,
    })
    cursor = next
  }

  return slots
}

export const DEFAULT_VOLUNTEER_INTERVIEW_APPLICANT_SCHEDULE_SEED =
  buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable: DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.recurringUnavailable,
    specificUnavailableDateIsos: ['2026-03-06', '2026-03-15'],
    availableTimeSlots: DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.availableTimeSlots,
  })

const DEFAULT_SCHEDULE_RANGE_START = dayjs('2026-03-01')
const DEFAULT_SCHEDULE_RANGE_END = dayjs('2026-03-31')

export function parseVolunteerInterviewApplicantScheduleFromSeed(
  seed: VolunteerInterviewScheduleEditSeed,
  options?: {
    rangeStart?: Dayjs
    rangeEnd?: Dayjs
  }
): ParsedVolunteerInterviewApplicantSchedule {
  const rangeStart = options?.rangeStart ?? DEFAULT_SCHEDULE_RANGE_START
  const rangeEnd = options?.rangeEnd ?? DEFAULT_SCHEDULE_RANGE_END

  const adminUnavailableKeys = new Set(seed.appliedUnavailableDates)
  const blockSaturday = seed.excludeSaturday
  const blockSunday = seed.excludeSunday
  const blockHoliday = seed.excludeHoliday
  const holidayDateKeys = blockHoliday ? getMockHolidayDateKeys() : new Set<string>()
  const enabledSlotLabels = new Set(seed.selectedTimeSlotLabels)

  const timeRange = buildDayjsTimeRange(seed.interviewTimeRange)
  const allSlotTemplates = buildVolunteerInterviewTimeSlots(timeRange, seed.timeUnit).map(slot => ({
    ...slot,
    enabled: enabledSlotLabels.has(slot.label),
  }))

  const clickableDateKeys = new Set<string>()

  let cursor = rangeStart.startOf('day')
  while (!cursor.isAfter(rangeEnd, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    const isSaturday = blockSaturday && cursor.day() === 6
    const isSunday = blockSunday && cursor.day() === 0
    const isHoliday = holidayDateKeys.has(dateKey)
    const isAdminUnavailable = adminUnavailableKeys.has(dateKey)
    const hasEnabledSlot = allSlotTemplates.some(slot => slot.enabled)

    if (!isSaturday && !isSunday && !isHoliday && !isAdminUnavailable && hasEnabledSlot) {
      clickableDateKeys.add(dateKey)
    }

    cursor = cursor.add(1, 'day')
  }

  const disabledDate = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD')
    if (blockSaturday && date.day() === 6) return true
    if (blockSunday && date.day() === 0) return true
    if (holidayDateKeys.has(dateKey)) return true
    if (adminUnavailableKeys.has(dateKey)) return true
    return !clickableDateKeys.has(dateKey)
  }

  const slotsForDate = (dateKey: string) => {
    if (!clickableDateKeys.has(dateKey)) {
      return []
    }
    return allSlotTemplates
  }

  return {
    clickableDateKeys,
    disabledDate,
    scheduleMonth: rangeStart.startOf('month'),
    rangeStart,
    rangeEnd,
    slotsForDate,
  }
}

export function resolveVolunteerInterviewApplicantScheduleSeed(
  seed?: VolunteerInterviewScheduleEditSeed
): VolunteerInterviewScheduleEditSeed {
  return seed ?? DEFAULT_VOLUNTEER_INTERVIEW_APPLICANT_SCHEDULE_SEED!
}
