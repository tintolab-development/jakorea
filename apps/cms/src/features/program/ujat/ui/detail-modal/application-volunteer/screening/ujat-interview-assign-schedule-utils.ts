import dayjs, { type Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { getUjatVolunteerInterviewScheduleMock } from '@/features/program/ujat/ui/detail-modal/info/ujat-volunteer-interview-schedule-mock'
import { parseUjatInterviewDateLabel } from './ujat-volunteer-interview-calendar-events'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** TODO(api): 공휴일 API 연동 */
const MOCK_HOLIDAY_DATE_KEYS_2026 = [
  '2026-01-01',
  '2026-01-28',
  '2026-01-29',
  '2026-01-30',
  '2026-03-01',
  '2026-05-05',
  '2026-05-24',
  '2026-06-06',
  '2026-08-15',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-10-03',
  '2026-10-09',
  '2026-12-25',
] as const

export function getMockHolidayDateKeys(): Set<string> {
  return new Set(MOCK_HOLIDAY_DATE_KEYS_2026)
}

/** 목록·배정 저장용 — `26. 03. 23(월)` */
export function formatStoredInterviewDateLabel(date: Dayjs): string {
  const y = date.year() % 100
  const m = String(date.month() + 1).padStart(2, '0')
  const d = String(date.date()).padStart(2, '0')
  const weekday = WEEKDAY_KO[date.day()]
  return `${String(y).padStart(2, '0')}. ${m}. ${d}(${weekday})`
}

/** 모달 요약·스크린 표시 — `26년 3월 23일(월)` */
export function formatInterviewSummaryDate(date: Dayjs): string {
  const y = date.year() % 100
  const m = date.month() + 1
  const d = date.date()
  const weekday = WEEKDAY_KO[date.day()]
  return `${y}년 ${m}월 ${d}일(${weekday})`
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

/** `26년 3월 6일(금)` 또는 `26. 03. 06(금)` */
export function parseInterviewDisplayDateLabel(label: string): Dayjs | null {
  const dotted = parseUjatInterviewDateLabel(label)
  if (dotted) return dotted

  const longMatch = label.match(/(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (!longMatch) return null
  return dayjs(`20${longMatch[1]}-${longMatch[2]}-${longMatch[3]}`)
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

/** TODO(api): 프로그램 면접 가능 일정 API 연동 */
export function parseInterviewScheduleMock(programId: string): ParsedInterviewSchedule {
  const data = getUjatVolunteerInterviewScheduleMock(programId)
  const commonSlots = parseTimeSlotsString(data.common.availableTimeSlots)
  const unavailableKeys = parseUnavailableDateLabels(data.common.specificUnavailableDates)
  const exceptionSlots = parseExceptionSlots(data.exceptions)
  const blockSunday = data.common.recurringUnavailable.includes('일요일')
  const includeHolidays = data.common.recurringUnavailable.includes('공휴일')
  const holidayDateKeys = includeHolidays ? getMockHolidayDateKeys() : new Set<string>()

  const slotsByDateKey = new Map<string, InterviewAssignSlot[]>()
  const clickableDateKeys = new Set<string>()

  const rangeStart = dayjs('2026-03-01')
  const rangeEnd = dayjs('2026-03-31')
  let cursor = rangeStart.startOf('day')

  while (!cursor.isAfter(rangeEnd, 'day')) {
    const dateKey = cursor.format('YYYY-MM-DD')
    const isSunday = blockSunday && cursor.day() === 0
    const isUnavailable = unavailableKeys.has(dateKey)

    if (!isSunday && !isUnavailable) {
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

  /**
   * 프로그램 면접 기간(2026-03) 밖 월은 antd disabled 미적용 → 회색이 아닌 일반 숫자·주말 색으로 탐색.
   * 기간 내에서만 일요일·지정 불가일·슬롯 없는 날을 선택 불가(회색) 처리.
   */
  const disabledDate = (date: Dayjs) => {
    if (date.isBefore(rangeStart, 'month') || date.isAfter(rangeEnd, 'month')) {
      return false
    }

    const dateKey = date.format('YYYY-MM-DD')
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

/** 모달 오픈 시 캘린더 월·선택일 초기값 — 면접 진행 가능 일정 월 고정 */
export function resolveInterviewAssignModalCalendarState(
  schedule: ParsedInterviewSchedule,
  applicant: UjatVolunteerApplicantRow
): { scheduleMonth: Dayjs; selectedDate: Dayjs; selectedSlotKey: string | null } {
  const { scheduleMonth, clickableDateKeys, disabledDate } = schedule
  const firstClickableKey = [...clickableDateKeys].sort()[0]
  const firstClickableDate = firstClickableKey
    ? dayjs(firstClickableKey)
    : scheduleMonth

  const initial = resolveInitialAssignSelection(applicant)

  let selectedDate = firstClickableDate
  let selectedSlotKey: string | null = null

  if (
    initial.date &&
    !initial.date.isBefore(schedule.rangeStart, 'day') &&
    !initial.date.isAfter(schedule.rangeEnd, 'day') &&
    !disabledDate(initial.date)
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

export function getSlotsForDate(
  schedule: ParsedInterviewSchedule,
  dateKey: string,
  applicant?: UjatVolunteerApplicantRow
): InterviewAssignSlot[] {
  const programSlots = schedule.slotsByDateKey.get(dateKey) ?? []
  if (!applicant) return programSlots

  const storedLabel = formatStoredInterviewDateLabel(dayjs(dateKey))
  const dayAvailability = applicant.interviewAvailability.find(
    day => day.dateLabel === storedLabel || parseUjatInterviewDateLabel(day.dateLabel)?.format('YYYY-MM-DD') === dateKey
  )
  if (!dayAvailability) return programSlots

  const allowed = new Set(dayAvailability.slots.map(normalizeTimeRangeKey))
  const filtered = programSlots.filter(slot => allowed.has(slot.timeRange))
  return filtered.length > 0 ? filtered : programSlots
}

export function formatInterviewSummary(date: Dayjs, timeRange: string): string {
  return `${formatInterviewSummaryDate(date)} ${formatDisplayTimeRange(timeRange)}`
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
