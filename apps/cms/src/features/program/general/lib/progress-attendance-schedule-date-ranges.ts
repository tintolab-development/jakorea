import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import type { ProgramScheduleDateRange } from '@/features/program/general/api/program-progress-api-client'
import type { Program } from '@/types/domain'

/** BE `DashboardScheduleWindow` — dateFrom~dateTo 간격 최대 365일. */
export const PROGRAM_SCHEDULE_RANGE_MAX_DAYS = 365
const DAY_MS = 86_400_000

const ISO_DATE_RE = /(\d{4})-(\d{2})-(\d{2})/u
const DOT_DATE_RE = /(\d{4})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})/gu
const KOREAN_DATE_RE = /(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/gu

function pad2(value: string): string {
  return value.padStart(2, '0')
}

function toDateKey(value: Program['startDate'] | null | undefined): string | null {
  if (value == null) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const match = ISO_DATE_RE.exec(value.trim())
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

/** 일정 줄·세부 일정 라벨에 들어 있는 날짜 (`26년 11월 16일`, `2026.11.16`) */
function readLabelDateKeys(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  const keys: string[] = []
  for (const [, y = '', m = '', d = ''] of text.matchAll(DOT_DATE_RE)) {
    keys.push(`${y}-${pad2(m)}-${pad2(d)}`)
  }
  for (const [, rawYear = '', m = '', d = ''] of text.matchAll(KOREAN_DATE_RE)) {
    const y = rawYear.length === 2 ? `20${rawYear}` : rawYear
    keys.push(`${y}-${pad2(m)}-${pad2(d)}`)
  }
  return keys
}

function isValidDateKey(key: string): boolean {
  return Number.isFinite(Date.parse(`${key}T00:00:00Z`))
}

function addDays(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * 출석 탭 일정 조회 범위.
 * 프로그램 운영 기간(startDate~endDate)과 FE가 이미 가진 일정 날짜(rounds, 교육 진행 일정 줄,
 * 세부 일정 진행 일정)의 최소~최대를 합친 범위를 365일 이하 구간으로 나눈다.
 * 날짜를 하나도 얻지 못하면 빈 배열(BE 기본 범위).
 */
export function resolveProgressAttendanceScheduleDateRanges(
  program: Pick<Program, 'startDate' | 'endDate'> &
    Partial<Pick<Program, 'rounds' | 'generalCommonInfo' | 'registrationOverlay'>>
): ProgramScheduleDateRange[] {
  const keys: string[] = []
  const push = (key: string | null) => {
    if (key && isValidDateKey(key)) keys.push(key)
  }
  push(toDateKey(program.startDate))
  push(toDateKey(program.endDate))
  for (const round of program.rounds ?? []) {
    push(toDateKey(round.startDate))
    push(toDateKey(round.endDate))
  }
  const commonInfo = program.generalCommonInfo
    ? resolveGeneralProgramCommonInfo(program as Program)
    : null
  for (const line of commonInfo?.educationScheduleLines ?? []) {
    readLabelDateKeys(line).forEach(push)
  }
  for (const detail of commonInfo?.scheduleDetails ?? []) {
    readLabelDateKeys(detail.scheduleDateLabel).forEach(push)
  }
  if (keys.length === 0) return []
  keys.sort()
  const first = keys[0]!
  const last = keys[keys.length - 1]!
  const ranges: ProgramScheduleDateRange[] = []
  let dateFrom = first
  while (dateFrom <= last) {
    const chunkEnd = addDays(dateFrom, PROGRAM_SCHEDULE_RANGE_MAX_DAYS)
    const dateTo = chunkEnd < last ? chunkEnd : last
    ranges.push({ dateFrom, dateTo })
    dateFrom = addDays(dateTo, 1)
  }
  return ranges
}
