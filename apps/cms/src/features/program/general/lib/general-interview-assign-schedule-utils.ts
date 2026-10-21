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

/**
 * remote interview-slots 가 있으면 그 날짜·시간이 배정 가능 슬롯이다.
 * 프로그램 문구의 주말·불가일·공통 시간대는 이 슬롯을 지우지 않는다.
 */
export function mergeRemoteSlotsIntoProgramSchedule(
  programSchedule: ParsedInterviewSchedule,
  remoteSchedule: ParsedInterviewSchedule
): ParsedInterviewSchedule {
  if (remoteSchedule.clickableDateKeys.size === 0) return programSchedule

  const rangeStart = programSchedule.rangeStart.isBefore(remoteSchedule.rangeStart, 'day')
    ? programSchedule.rangeStart
    : remoteSchedule.rangeStart
  const rangeEnd = programSchedule.rangeEnd.isAfter(remoteSchedule.rangeEnd, 'day')
    ? programSchedule.rangeEnd
    : remoteSchedule.rangeEnd
  const clickableDateKeys = new Set(remoteSchedule.clickableDateKeys)

  return {
    ...programSchedule,
    slotsByDateKey: new Map(remoteSchedule.slotsByDateKey),
    clickableDateKeys,
    disabledDate: (date: Dayjs) => !clickableDateKeys.has(date.format('YYYY-MM-DD')),
    rangeStart,
    rangeEnd,
    scheduleMonth: remoteSchedule.scheduleMonth,
  }
}

function formatInstantInSeoul(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  const hour = value('hour')
  const minute = value('minute')
  if (!/^\d{2}$/.test(hour) || !/^\d{2}$/.test(minute)) return null
  return `${hour}:${minute}`
}

/** interview-slots `startAt`/`endAt` → 신청 가능 일정과 같은 한국 시간 `HH:mm ~ HH:mm` */
function timeRangeFromIso(startAt: string, endAt: string): string | null {
  const start = formatInstantInSeoul(startAt)
  const end = formatInstantInSeoul(endAt)
  if (!start || !end) return null
  return normalizeTimeRangeKey(`${start} ~ ${end}`)
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
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(slot.slotDate)
      ? slot.slotDate
      : dayjs(slot.slotDate).isValid()
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
 * 봉사자가 신청한 면접 가능 일정과 실제 배정 가능한 프로그램 슬롯의 교집합만 남긴다.
 *
 * 면접 배정은 프로그램 슬롯에 존재하면서 봉사자가 선택한 시간대에서만 가능해야 한다.
 * 따라서 신청자의 가능 일정을 프로그램 일정에 단순히 추가하거나, 프로그램 전체 슬롯을
 * 그대로 노출하면 안 된다.
 */
export function mergeApplicantAvailabilityIntoSchedule(
  schedule: ParsedInterviewSchedule,
  interviewAvailability: { dateLabel: string; slots: string[] }[]
): ParsedInterviewSchedule {
  const availabilityByDate = new Map<string, Set<string>>()
  for (const day of interviewAvailability) {
    const date = parseInterviewDisplayDateLabel(day.dateLabel)
    if (!date) continue
    const slots = new Set(
      day.slots
        .filter(raw => /\d{2}:\d{2}/.test(raw))
        .map(normalizeTimeRangeKey)
    )
    if (slots.size > 0) availabilityByDate.set(date.format('YYYY-MM-DD'), slots)
  }

  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()
  let firstAvailabilityKey: string | null = null

  for (const [dateKey, programSlots] of schedule.slotsByDateKey) {
    const availableSlots = availabilityByDate.get(dateKey)
    if (!availableSlots) continue
    const slots = programSlots.filter(slot => availableSlots.has(slot.timeRange))
    if (slots.length === 0) continue
    slotsByDateKey.set(dateKey, slots)
    clickableDateKeys.add(dateKey)
    if (!firstAvailabilityKey || dateKey < firstAvailabilityKey) firstAvailabilityKey = dateKey
  }

  return {
    ...schedule,
    slotsByDateKey,
    clickableDateKeys,
    disabledDate: (date: Dayjs) => !clickableDateKeys.has(date.format('YYYY-MM-DD')),
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
