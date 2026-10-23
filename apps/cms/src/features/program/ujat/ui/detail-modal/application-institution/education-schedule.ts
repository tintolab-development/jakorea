import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import {
  isoDateFromScheduleInstant,
  isExactDayProgramSchedule,
  resolveScheduleIdForIsoDate,
  type ProgramScheduleListItem,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { resolveUjatEducationScheduleSettingsSemesterDisplay } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import type { UjatHalfEventRangeSeal } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'

dayjs.extend(isSameOrBefore)

export type UjatInstitutionEducationSemesterKey = 'h1' | 'h2'

export type UjatInstitutionScheduleAssignDateEntry = {
  isoDate: string
  title: string
  semester: UjatInstitutionEducationSemesterKey | null
  scheduleId?: number
}

/** 일정 열 키 — 프로그램 schedules API의 날짜(YYYY-MM-DD) */
export type UjatInstitutionScheduleSlotKey = string

export type UjatInstitutionScheduleColumn = {
  key: UjatInstitutionScheduleSlotKey
  title: string
  isoDate: string
}

export function listAssignableFridayIsoDatesInPeriod(
  startDate: string,
  endDate: string,
  unavailableIsoDates: readonly string[] = []
): string[] {
  const blocked = new Set(unavailableIsoDates)
  return listFridayIsoDatesInPeriod(startDate, endDate).filter(iso => !blocked.has(iso))
}

export function listFridayIsoDatesInPeriod(startDate: string, endDate: string): string[] {
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return []

  let cursor = start
  while (cursor.day() !== 5) {
    cursor = cursor.add(1, 'day')
    if (cursor.isAfter(end, 'day')) return []
  }

  const out: string[] = []
  while (cursor.isSameOrBefore(end, 'day')) {
    out.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(7, 'day')
  }
  return out
}

/** 기관 신청 목록 날짜 열 헤더 — `M월 D일` (GET schedules startAt 달력일) */
export function formatScheduleColumnTitle(isoDate: string): string {
  const d = dayjs(isoDate)
  if (!d.isValid()) return isoDate
  return `${d.month() + 1}월 ${d.date()}일`
}

/** 교육 진행 희망일 등 표시용 — `2026.04.24(금)` */
export function formatUjatInstitutionFridayDisplay(isoDate: string): string {
  const d = dayjs(isoDate)
  if (!d.isValid()) return isoDate
  const label = formatDateDotWithWeekday(d)
  return label === '-' ? isoDate : label
}

const KOREAN_PREFERRED_DATE = /^\d{2,4}년\s*\d{1,2}월\s*\d{1,2}일?(?:\([^)]+\))?$/

/** 신청 기관 상세 희망일 — `26년 4월 24일(금)` */
export function formatUjatPreferredEducationDateDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '-'
  if (KOREAN_PREFERRED_DATE.test(trimmed.replace(/\s+/g, ' '))) return trimmed

  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
  const d = iso ? dayjs(iso) : dayjs(trimmed)
  if (!d.isValid()) return trimmed

  const dotted = formatDateDotWithWeekday(d)
  if (dotted === '-') return trimmed
  const open = dotted.lastIndexOf('(')
  const close = dotted.lastIndexOf(')')
  const weekday = open >= 0 && close > open ? dotted.slice(open + 1, close) : ''
  const weekdayPart = weekday ? `(${weekday})` : ''
  return `${String(d.year()).slice(-2)}년 ${d.month() + 1}월 ${d.date()}일${weekdayPart}`
}

export function sumGradeClassCounts(
  gradeClassCounts: ReadonlyArray<{ classCount: number | null }>
): number {
  return gradeClassCounts.reduce((sum, g) => sum + (g.classCount ?? 0), 0)
}

export function buildEmptyScheduleSlots(): Record<string, 'O' | '-'> {
  return {}
}

export function scheduleColumnsFromDates(
  dates: readonly UjatInstitutionScheduleAssignDateEntry[]
): UjatInstitutionScheduleColumn[] {
  return dates.map(entry => ({
    key: entry.isoDate,
    title: entry.title,
    isoDate: entry.isoDate,
  }))
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** 목록 날짜 열 — 행의 희망일(O)만. GET schedules 기간·overlay로 금요일을 펼치지 않는다. */
export function collectPreferredEducationIsoDates(
  rows: ReadonlyArray<{ scheduleSlots: Record<string, 'O' | '-'> }>
): string[] {
  const dates = new Set<string>()
  for (const row of rows) {
    for (const [iso, mark] of Object.entries(row.scheduleSlots)) {
      if (mark === 'O' && ISO_DATE.test(iso)) dates.add(iso)
    }
  }
  return [...dates].sort()
}

export function scheduleColumnsFromIsoDates(
  isoDates: readonly string[]
): UjatInstitutionScheduleColumn[] {
  return isoDates.map(isoDate => ({
    key: isoDate,
    title: formatScheduleColumnTitle(isoDate),
    isoDate,
  }))
}

function readScheduleSemester(item: ProgramScheduleListItem): UjatInstitutionEducationSemesterKey | null {
  const raw = String(item.semesterType ?? item.half ?? item.semester ?? '')
    .trim()
    .toUpperCase()
  if (!raw) return null
  if (
    raw === 'H1' ||
    raw === 'FIRST' ||
    raw === 'FIRST_HALF' ||
    raw.includes('FIRST') ||
    raw.includes('상반')
  ) {
    return 'h1'
  }
  if (
    raw === 'H2' ||
    raw === 'SECOND' ||
    raw === 'SECOND_HALF' ||
    raw.includes('SECOND') ||
    raw.includes('하반')
  ) {
    return 'h2'
  }
  return null
}

function isoInEventRange(isoDate: string, range: UjatHalfEventRangeSeal | undefined): boolean {
  if (!range?.start || !range.end) return false
  const d = dayjs(isoDate)
  const start = dayjs(range.start)
  const end = dayjs(range.end)
  if (!d.isValid() || !start.isValid() || !end.isValid()) return false
  return !d.isBefore(start, 'day') && !d.isAfter(end, 'day')
}

export function resolveEducationSemesterForIsoDate(
  isoDate: string,
  overlay?: Record<string, unknown>
): UjatInstitutionEducationSemesterKey | null {
  const h1 = resolveUjatEducationScheduleSettingsSemesterDisplay('h1', overlay).eventRange
  const h2 = resolveUjatEducationScheduleSettingsSemesterDisplay('h2', overlay).eventRange
  if (isoInEventRange(isoDate, h1)) return 'h1'
  if (isoInEventRange(isoDate, h2)) return 'h2'
  return null
}

/** GET /programs/{id}/schedules 항목만 날짜 열로 쓴다. 응답이 없으면 빈 배열. overlay로 날짜·학기를 채우지 않는다. */
export function buildUjatProgramScheduleDates(
  schedules: readonly ProgramScheduleListItem[],
  overlay?: Record<string, unknown>
): UjatInstitutionScheduleAssignDateEntry[] {
  const seen = new Set<string>()
  const entries: UjatInstitutionScheduleAssignDateEntry[] = []

  for (const item of schedules) {
    const iso =
      isoDateFromScheduleInstant(item.startAt) ??
      isoDateFromScheduleInstant(item.scheduleStartAt)
    if (!iso || seen.has(iso)) continue
    seen.add(iso)
    const scheduleIdRaw = item.id ?? item.scheduleId
    const scheduleId =
      scheduleIdRaw != null && Number.isFinite(Number(scheduleIdRaw))
        ? Number(scheduleIdRaw)
        : undefined
    const semesterFromApi = readScheduleSemester(item)
    entries.push({
      isoDate: iso,
      title: formatScheduleColumnTitle(iso),
      semester:
        semesterFromApi ??
        (overlay != null ? resolveEducationSemesterForIsoDate(iso, overlay) : null),
      scheduleId,
    })
  }

  return entries.sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

/**
 * 임시 배정 날짜 열은 preferredEducationSchedules 달력일만.
 * GET /schedules의 연간 PROGRAM_DEFINED 창·다른 하루 행을 열로 추가하지 않는다.
 */
export function buildUjatScheduleAssignDates(input: {
  preferredIsoDates: readonly string[]
  schedules: readonly ProgramScheduleListItem[]
  overlay?: Record<string, unknown>
}): UjatInstitutionScheduleAssignDateEntry[] {
  const seen = new Set<string>()
  const entries: UjatInstitutionScheduleAssignDateEntry[] = []

  for (const iso of input.preferredIsoDates) {
    if (!ISO_DATE.test(iso) || seen.has(iso)) continue
    seen.add(iso)
    const matched = input.schedules.find(item => {
      if (!isExactDayProgramSchedule(item)) return false
      const start =
        isoDateFromScheduleInstant(item.startDate) ??
        isoDateFromScheduleInstant(item.startAt) ??
        isoDateFromScheduleInstant(item.scheduleStartAt)
      return start === iso
    })
    entries.push({
      isoDate: iso,
      title: formatScheduleColumnTitle(iso),
      semester:
        (matched ? readScheduleSemester(matched) : null) ??
        (input.overlay != null ? resolveEducationSemesterForIsoDate(iso, input.overlay) : null),
      scheduleId: resolveScheduleIdForIsoDate(input.schedules, iso) ?? undefined,
    })
  }

  return entries.sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

export function filterScheduleDatesByHalf(
  dates: readonly UjatInstitutionScheduleAssignDateEntry[],
  half: UjatInstitutionEducationSemesterKey
): UjatInstitutionScheduleAssignDateEntry[] {
  return dates.filter(entry => entry.semester === half)
}
