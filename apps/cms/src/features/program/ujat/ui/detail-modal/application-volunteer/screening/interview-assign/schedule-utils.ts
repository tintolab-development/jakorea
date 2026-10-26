import dayjs, { type Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerInterviewScheduleData } from '@/features/program/ujat/model/ujat-volunteer-interview-schedule'
import { parseUjatInterviewDateLabel } from '../shared/interview-calendar-events'
import { formatDateDotWithWeekday } from '@/shared/utils/date'

import { getKoreanPublicHolidayDateKeysSync } from '@/features/program/ujat/api/korean-public-holidays'

/** 면접·일정 UI — 동기 공휴일 집합(API prefetch 후 채움, 미로드 시 빈 Set) */
export function getPublicHolidayDateKeysForSchedule(): Set<string> {
  return getKoreanPublicHolidayDateKeysSync()
}

/** 목록·배정 저장용 — `2026.03.23(월)` */
export function formatStoredInterviewDateLabel(date: Dayjs): string {
  const label = formatDateDotWithWeekday(date)
  return label === '-' ? '' : label
}

/** 모달 요약·스크린 표시 — `2026.03.23(월)` */
export function formatInterviewSummaryDate(date: Dayjs): string {
  const label = formatDateDotWithWeekday(date)
  return label === '-' ? '' : label
}

/** `09:00 ~ 09:30` → `09:00 - 09:30` */
export function formatDisplayTimeRange(timeRange: string): string {
  return timeRange.replace(/\s*~\s*/g, ' - ')
}

export function normalizeTimeRangeKey(timeRange: string): string {
  const match = timeRange.match(/(\d{2}:\d{2})\s*[-~]\s*(\d{2}:\d{2})/)
  if (!match) return timeRange.trim()
  return `${match[1]} ~ ${match[2]}`
}

function parseTimeSlotsString(slotsString: string): string[] {
  return slotsString
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeTimeRangeKey)
}

/** `2026.03.06(금)` · `26년 3월 6일(금)` · `26. 03. 06(금)` */
export function parseInterviewDisplayDateLabel(label: string): Dayjs | null {
  const dotted = parseUjatInterviewDateLabel(label)
  if (dotted) return dotted

  const longYear = label.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (longYear) {
    const parsed = dayjs(
      `${longYear[1]}-${String(longYear[2]).padStart(2, '0')}-${String(longYear[3]).padStart(2, '0')}`
    )
    return parsed.isValid() ? parsed : null
  }
  const shortYear = label.match(/(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (!shortYear) return null
  return dayjs(`20${shortYear[1]}-${shortYear[2]}-${shortYear[3]}`)
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

function parseExceptionSlots(
  exceptions: { exceptionDate: string; availableTimeSlots: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const ex of exceptions) {
    const parsed = parseInterviewDisplayDateLabel(ex.exceptionDate)
    if (!parsed) continue
    map.set(parsed.format('YYYY-MM-DD'), parseTimeSlotsString(ex.availableTimeSlots))
  }
  return map
}

export type InterviewAssignSlot = {
  key: string
  timeRange: string
  displayTimeRange: string
}

export type ParsedInterviewSchedule = {
  slotsByDateKey: Map<string, InterviewAssignSlot[]>
  clickableDateKeys: Set<string>
  holidayDateKeys: Set<string>
  disabledDate: (date: Dayjs) => boolean
  /** 면접 진행 가능 일정 기간 시작 */
  rangeStart: Dayjs
  /** 면접 진행 가능 일정 기간 종료 */
  rangeEnd: Dayjs
  /** 모달 오픈 시 캘린더에 표시할 월 — 면접 진행 가능 일정 월 */
  scheduleMonth: Dayjs
}

/** 모집 행 interviewConfig 표시값으로 배정 캘린더를 만든다. */
export function parseInterviewScheduleFromDisplay(
  data: UjatVolunteerInterviewScheduleData,
  range?: { startIso?: string | Date | null; endIso?: string | Date | null },
  publicHolidayDateKeys?: ReadonlySet<string>
): ParsedInterviewSchedule {
  const commonSlots = parseTimeSlotsString(
    data.common.availableTimeSlots === '-' ? '' : data.common.availableTimeSlots
  )
  const unavailableKeys = parseUnavailableDateLabels(
    data.common.specificUnavailableDates === '-' ? '' : data.common.specificUnavailableDates
  )
  const exceptionSlots = parseExceptionSlots(data.exceptions)
  const blockSunday = data.common.recurringUnavailable.includes('일요일')
  const blockHoliday = data.common.recurringUnavailable.includes('공휴일')
  const holidayDateKeys = new Set<string>(publicHolidayDateKeys ?? [])

  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  const parsedStart = range?.startIso ? dayjs(range.startIso) : dayjs().startOf('day')
  const parsedEnd = range?.endIso ? dayjs(range.endIso) : parsedStart
  const rangeStart = parsedStart.isValid() ? parsedStart.startOf('day') : dayjs().startOf('day')
  const rangeEnd =
    parsedEnd.isValid() && !parsedEnd.isBefore(rangeStart, 'day')
      ? parsedEnd.startOf('day')
      : rangeStart
  let cursor = rangeStart.startOf('day')

  while (!cursor.isAfter(rangeEnd, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    const isSunday = blockSunday && cursor.day() === 0
    const isUnavailable = unavailableKeys.has(dateKey)
    const isBlockedHoliday = blockHoliday && holidayDateKeys.has(dateKey)

    if (!isSunday && !isUnavailable && !isBlockedHoliday) {
      const slotTimes = exceptionSlots.get(dateKey) ?? commonSlots
      const slots: InterviewAssignSlot[] = slotTimes.map(timeRange => ({
        key: `${dateKey}|${timeRange}`,
        timeRange,
        displayTimeRange: formatDisplayTimeRange(timeRange),
      }))
      if (slots.length > 0) {
        slotsByDateKey.set(dateKey, slots)
        clickableDateKeys.add(dateKey)
      }
    }

    cursor = cursor.add(1, 'day')
  }

  /** 면접 기간·슬롯 없는 날·일요일·지정 불가일·(설정 시) 공휴일 → 클릭 비활성(캘린더 opacity 0.5) */
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

/** 모달 오픈 시 캘린더 월·선택일 초기값 — 면접 진행 가능 일정 월 고정 */
export function resolveInterviewAssignModalCalendarState(
  schedule: ParsedInterviewSchedule,
  applicant: UjatVolunteerApplicantRow
): { scheduleMonth: Dayjs; selectedDate: Dayjs; selectedSlotKey: string | null } {
  const { scheduleMonth, clickableDateKeys, disabledDate } = schedule
  const availabilityKeys = getApplicantInterviewAvailabilityDateKeys(applicant)
  const preferredKeys =
    availabilityKeys.size > 0
      ? [...clickableDateKeys].filter(key => availabilityKeys.has(key)).sort()
      : [...clickableDateKeys].sort()
  const firstClickableKey = preferredKeys[0] ?? [...clickableDateKeys].sort()[0]
  const firstClickableDate = firstClickableKey ? dayjs(firstClickableKey) : scheduleMonth

  const initial = resolveInitialAssignSelection(applicant)

  let selectedDate = firstClickableDate
  let selectedSlotKey: string | null = null

  if (
    initial.date &&
    !initial.date.isBefore(schedule.rangeStart, 'day') &&
    !initial.date.isAfter(schedule.rangeEnd, 'day') &&
    !disabledDate(initial.date) &&
    (availabilityKeys.size === 0 || availabilityKeys.has(initial.date.format('YYYY-MM-DD')))
  ) {
    selectedDate = initial.date
    selectedSlotKey = initial.slotKey
  }

  return {
    scheduleMonth,
    selectedDate,
    selectedSlotKey,
  }
}

/**
 * 면접일 배정 모달 — 해당일 시간대 목록.
 * SSOT = 프로그램 면접 가능 시간(`slotsByDateKey`). 신청 `interviewAvailability`로 제한하지 않는다.
 */
export function getSlotsForDate(
  schedule: ParsedInterviewSchedule,
  dateKey: string,
  _applicant?: UjatVolunteerApplicantRow
): InterviewAssignSlot[] {
  if (!schedule.clickableDateKeys.has(dateKey)) return []
  return schedule.slotsByDateKey.get(dateKey) ?? []
}

export function formatInterviewSummary(date: Dayjs, timeRange: string): string {
  return `${formatInterviewSummaryDate(date)} ${formatDisplayTimeRange(timeRange)}`
}

/** 면접일 배정 모달 「배정된 일정」 요약 — `2026.03.23(월) 09:00 ~ 09:30` */
/** 면접 진행 기간 내 프로그램 지정 불가일(토·일·공휴·지정일 등) — 가능일 집합의 여집합 */
export function buildProgramInterviewUnavailableDateKeys(
  schedule: ParsedInterviewSchedule
): Set<string> {
  const keys = new Set<string>()
  let cursor = schedule.rangeStart.startOf('day')
  const end = schedule.rangeEnd.startOf('day')
  while (!cursor.isAfter(end, 'day')) {
    const key = cursor.format('YYYY-MM-DD')
    if (!schedule.clickableDateKeys.has(key)) keys.add(key)
    cursor = cursor.add(1, 'day')
  }
  return keys
}

export function formatInterviewAssignScheduledSummary(date: Dayjs, timeRange: string): string {
  const datePart = formatDateDotWithWeekday(date)
  const time = normalizeTimeRangeKey(timeRange)
  return datePart === '-' ? time : `${datePart} ${time}`
}

function dateLabelsMatch(a: string, b: string): boolean {
  const da = parseUjatInterviewDateLabel(a) ?? parseInterviewDisplayDateLabel(a)
  const db = parseUjatInterviewDateLabel(b) ?? parseInterviewDisplayDateLabel(b)
  if (da && db) return da.isSame(db, 'day')
  return a === b
}

/** 봉사자가 신청 시 선택한 면접 가능일 — 캘린더 연한 민트(`--has-schedule`) 표시용 */
export function getApplicantInterviewAvailabilityDateKeys(
  applicant: UjatVolunteerApplicantRow
): Set<string> {
  const keys = new Set<string>()
  for (const day of applicant.interviewAvailability) {
    const parsed =
      parseUjatInterviewDateLabel(day.dateLabel) ??
      parseInterviewDisplayDateLabel(day.dateLabel)
    if (parsed) keys.add(parsed.format('YYYY-MM-DD'))
  }
  return keys
}

/** 면접일 배정이 완료된 날짜 집합 — 캘린더 `calendar-mini-cell--assignment-complete` 표시용 */
export function getAssignedInterviewDateKeys(
  applicants: UjatVolunteerApplicantRow[]
): Set<string> {
  const keys = new Set<string>()
  for (const row of applicants) {
    if (row.interviewAssignmentStatus !== 'assigned') continue
    if (!row.assignedInterviewDateLabel) continue
    const parsed =
      parseUjatInterviewDateLabel(row.assignedInterviewDateLabel) ??
      parseInterviewDisplayDateLabel(row.assignedInterviewDateLabel)
    if (parsed) keys.add(parsed.format('YYYY-MM-DD'))
  }
  return keys
}

/** 봉사자 1명당 배정된 슬롯 키 (`YYYY-MM-DD|09:00 ~ 09:30`) — 없으면 null */
export function getApplicantAssignedSlotKey(
  applicant: UjatVolunteerApplicantRow
): string | null {
  if (applicant.interviewAssignmentStatus !== 'assigned') return null
  if (!applicant.assignedInterviewDateLabel || !applicant.assignedInterviewTime) return null
  const parsed =
    parseUjatInterviewDateLabel(applicant.assignedInterviewDateLabel) ??
    parseInterviewDisplayDateLabel(applicant.assignedInterviewDateLabel)
  if (!parsed) return null
  return `${parsed.format('YYYY-MM-DD')}|${normalizeTimeRangeKey(applicant.assignedInterviewTime)}`
}

export function countSlotAssignments(
  applicants: UjatVolunteerApplicantRow[],
  dateLabel: string,
  timeRange: string,
  excludeId?: string
): number {
  const normalizedTime = normalizeTimeRangeKey(timeRange)
  return applicants.filter(row => {
    if (excludeId && row.id === excludeId) return false
    if (row.interviewAssignmentStatus !== 'assigned') return false
    if (!row.assignedInterviewDateLabel || !row.assignedInterviewTime) return false
    if (!dateLabelsMatch(row.assignedInterviewDateLabel, dateLabel)) return false
    return normalizeTimeRangeKey(row.assignedInterviewTime) === normalizedTime
  }).length
}

export function resolveInitialAssignSelection(applicant: UjatVolunteerApplicantRow): {
  date: Dayjs | null
  slotKey: string | null
} {
  if (!applicant.assignedInterviewDateLabel || !applicant.assignedInterviewTime) {
    return { date: null, slotKey: null }
  }
  const date = parseUjatInterviewDateLabel(applicant.assignedInterviewDateLabel)
  if (!date) return { date: null, slotKey: null }
  const timeRange = normalizeTimeRangeKey(applicant.assignedInterviewTime)
  return {
    date,
    slotKey: `${date.format('YYYY-MM-DD')}|${timeRange}`,
  }
}
