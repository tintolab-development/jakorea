import dayjs, { type Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralInterviewSlotListItem } from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK, GENERAL_INTERVIEW_MOCK_RANGE } from '@/features/program/general/model/volunteer-interview-schedule'
import {
  formatDisplayTimeRange,
  getPublicHolidayDateKeysForSchedule,
  normalizeTimeRangeKey,
  parseInterviewDisplayDateLabel,
  type InterviewAssignSlot,
  type ParsedInterviewSchedule,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

export type { InterviewAssignSlot, ParsedInterviewSchedule }

/**
 * 면접일 배정 캘린더 remote 여부.
 * - mock 카탈로그·로컬 등록 프로그램 → 항상 mock
 * - 신청 목록이 mock인 화면(참여자 등) → mock (`applicationsUseRemote=false`)
 * - remote 실제 프로그램 + 신청 remote ON → interview-slots API
 */
export function shouldUseRemoteInterviewSchedule(
  programId: string,
  options?: { applicationsUseRemote?: boolean }
): boolean {
  if (!programId.trim()) return false
  if (options?.applicationsUseRemote === false) return false
  if (resolveGeneralProgramForDetail(programId) != null) return false
  return shouldUseGeneralApplicationsRemoteApi()
}

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

function resolveUnavailableDateKeys(source: {
  specificUnavailableDates?: string
  specificUnavailableDateIsos?: string[]
}): Set<string> {
  const keys = parseUnavailableDateLabels(source.specificUnavailableDates ?? '')
  for (const iso of source.specificUnavailableDateIsos ?? []) {
    const parsed = dayjs(iso)
    if (parsed.isValid()) keys.add(parsed.format('YYYY-MM-DD'))
  }
  return keys
}

function resolveInterviewScheduleRange(program: Program): { start: Dayjs; end: Dayjs } {
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const recruit = program.generalCommonInfo?.volunteerRecruitmentInfo as
    | { interviewStartDate?: string; interviewEndDate?: string }
    | undefined

  const startCandidates = [
    info?.periodStartDate,
    recruit?.interviewStartDate,
    program.interviewStartDate,
  ]
  const endCandidates = [info?.periodEndDate, recruit?.interviewEndDate, program.interviewEndDate]

  const start =
    startCandidates.map(value => (value ? dayjs(value) : null)).find(d => d?.isValid()) ??
    dayjs(GENERAL_INTERVIEW_MOCK_RANGE.startIso)
  const endRaw =
    endCandidates.map(value => (value ? dayjs(value) : null)).find(d => d?.isValid()) ??
    dayjs(GENERAL_INTERVIEW_MOCK_RANGE.endIso)
  const end = endRaw.isBefore(start, 'day') ? start : endRaw
  return { start: start.startOf('day'), end: end.startOf('day') }
}

function buildParsedInterviewSchedule(
  source: GeneralInterviewScheduleSource & { specificUnavailableDateIsos?: string[] },
  rangeStart: Dayjs,
  rangeEnd: Dayjs,
  publicHolidayDateKeys?: ReadonlySet<string>
): ParsedInterviewSchedule {
  const commonSlots = parseTimeSlotsString(source.availableTimeSlots)
  const unavailableKeys = resolveUnavailableDateKeys(source)
  const blockSaturday = source.recurringUnavailable.includes('토요일')
  const blockSunday = source.recurringUnavailable.includes('일요일')
  const includeHolidays = source.recurringUnavailable.includes('공휴일')
  /** 호출부에서 조회한 공휴일 우선 — sync 캐시는 React 조회 전엔 비어 있을 수 있음 */
  const holidayDateKeys = includeHolidays
    ? new Set<string>(publicHolidayDateKeys ?? getPublicHolidayDateKeysForSchedule())
    : new Set<string>()

  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  let cursor = rangeStart.startOf('day')
  while (!cursor.isAfter(rangeEnd, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    const isSaturday = blockSaturday && cursor.day() === 6
    const isSunday = blockSunday && cursor.day() === 0
    const isUnavailable =
      unavailableKeys.has(dateKey) || (includeHolidays && holidayDateKeys.has(dateKey))

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

/** remote interview-slots 를 프로그램 스케줄에 합친다(가능일·불가일 SSOT는 프로그램 유지). */
export function mergeRemoteSlotsIntoProgramSchedule(
  programSchedule: ParsedInterviewSchedule,
  remoteSchedule: ParsedInterviewSchedule
): ParsedInterviewSchedule {
  if (remoteSchedule.clickableDateKeys.size === 0) return programSchedule

  const slotsByDateKey = new Map(programSchedule.slotsByDateKey)
  for (const [dateKey, remoteSlots] of remoteSchedule.slotsByDateKey) {
    if (!programSchedule.clickableDateKeys.has(dateKey)) continue
    const daySlots = [...(slotsByDateKey.get(dateKey) ?? [])]
    for (const slot of remoteSlots) {
      if (daySlots.some(existing => existing.key === slot.key)) continue
      daySlots.push(slot)
    }
    slotsByDateKey.set(dateKey, daySlots)
  }

  return {
    ...programSchedule,
    slotsByDateKey,
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
 * 봉사자가 신청한 면접 시간대를 프로그램 가능일 슬롯에 합친다.
 * 프로그램 불가일·기간 밖 신청일은 clickable에 넣지 않는다(가능/불가 SSOT = 프로그램).
 * `program_interview_slot`이 비어도 가능일 위 신청 시간대로 배정할 수 있다.
 */
export function mergeApplicantAvailabilityIntoSchedule(
  schedule: ParsedInterviewSchedule,
  interviewAvailability: { dateLabel: string; slots: string[] }[]
): ParsedInterviewSchedule {
  if (interviewAvailability.length === 0) return schedule

  const today = dayjs().startOf('day')
  const slotsByDateKey = new Map(schedule.slotsByDateKey)
  let touched = false
  let firstAvailabilityKey: string | null = null

  for (const day of interviewAvailability) {
    const date = parseInterviewDisplayDateLabel(day.dateLabel)
    if (!date || date.isBefore(today, 'day')) continue
    const dateKey = date.format('YYYY-MM-DD')
    if (!schedule.clickableDateKeys.has(dateKey)) continue

    const daySlots = [...(slotsByDateKey.get(dateKey) ?? [])]
    for (const raw of day.slots) {
      if (!/\d{2}:\d{2}/.test(raw)) continue
      const timeRange = normalizeTimeRangeKey(raw)
      const key = `${dateKey}|${timeRange}`
      if (daySlots.some(slot => slot.key === key)) continue
      daySlots.push({ key, timeRange, displayTimeRange: formatDisplayTimeRange(timeRange) })
      touched = true
    }
    if (daySlots.length === 0) continue
    slotsByDateKey.set(dateKey, daySlots)
    if (!firstAvailabilityKey || dateKey < firstAvailabilityKey) firstAvailabilityKey = dateKey
  }

  if (!touched) return schedule

  return {
    ...schedule,
    slotsByDateKey,
    scheduleMonth: dayjs(firstAvailabilityKey ?? schedule.scheduleMonth).startOf('month'),
  }
}

/** 목록 availability·배정 팝업 정합용 — 2026.09~10 DEFAULT mock 스케줄 */
export function parseGeneralInterviewScheduleFromDefaultMock(): ParsedInterviewSchedule {
  return buildParsedInterviewSchedule(
    DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK,
    dayjs(GENERAL_INTERVIEW_MOCK_RANGE.startIso),
    dayjs(GENERAL_INTERVIEW_MOCK_RANGE.endIso)
  )
}

/**
 * 프로그램에 등록된 면접 가능/불가 일정으로 배정 캘린더를 만든다.
 * 기간·불가일·시간대 SSOT = `volunteerInterviewScheduleInfo`(없으면 모집 면접 기간·DEFAULT mock).
 */
export function parseGeneralInterviewScheduleFromProgram(
  program: Program,
  publicHolidayDateKeys?: ReadonlySet<string>
): ParsedInterviewSchedule {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const parsedSlots = parseTimeSlotsString(
    display.availableTimeSlots === '-' ? '' : display.availableTimeSlots
  )
  /** 시간대가 파싱되지 않으면 mock 폴백 — 빈 스케줄로 팝업이 비는 것 방지 */
  if (parsedSlots.length === 0) {
    return parseGeneralInterviewScheduleFromDefaultMock()
  }
  const { start, end } = resolveInterviewScheduleRange(program)
  return buildParsedInterviewSchedule(
    {
      recurringUnavailable:
        display.recurringUnavailable === '-'
          ? DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.recurringUnavailable
          : display.recurringUnavailable,
      specificUnavailableDates:
        display.specificUnavailableDates === '-' ? '' : display.specificUnavailableDates,
      specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
      availableTimeSlots: display.availableTimeSlots,
    },
    start,
    end,
    publicHolidayDateKeys
  )
}
