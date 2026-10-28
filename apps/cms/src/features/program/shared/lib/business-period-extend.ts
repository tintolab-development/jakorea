import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { isCommonInfoEditPeriodOpen } from '@/features/program/shared/lib/program-edit-window'
import type { ProgramBusinessPeriodHistoryItem } from '@/features/program/shared/api/business-period-api'

const SEOUL_TIME_ZONE = 'Asia/Seoul'

export const PROGRAM_EDIT_PERMISSION_CODES = ['PROGRAM_EDIT', 'CRUD_PROGRAM_EDIT'] as const

export const BUSINESS_PERIOD_EXTEND_BUTTON_LABEL = '사업 기간 연장(개발용)'

/** Vite DEV에서만 연장 버튼을 노출한다. 프로덕션 빌드에서는 항상 false. */
export function isBusinessPeriodExtendUiEnabled(): boolean {
  return import.meta.env.DEV === true
}

export const BUSINESS_PERIOD_EXTEND_DISABLED_EDIT_TOOLTIP =
  '사업 기간 종료 후에는 종료일 연장만 가능합니다'
export const BUSINESS_PERIOD_EXTEND_SUCCESS_ALERT = '사업 종료일을 연장했습니다'
export const BUSINESS_PERIOD_EXTEND_INVALID_DATE_MESSAGE =
  '연장할 종료일이 올바르지 않습니다.'
export const BUSINESS_PERIOD_EXTEND_SHORTEN_NOT_ALLOWED_MESSAGE =
  '기존 종료일보다 이후 날짜만 선택할 수 있습니다'
export const BUSINESS_PERIOD_EXTEND_FORBIDDEN_MESSAGE =
  '사업 기간을 연장할 권한이 없습니다.'

export function seoulCalendarDateKey(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const dateOnly = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    if (dateOnly) return dateOnly[1]
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

function addOneCalendarDay(ymd: string): string | null {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  const nextYear = next.getUTCFullYear()
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(next.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

function maxYmd(a: string, b: string): string {
  return a >= b ? a : b
}

/** 새 종료일 최소값 = max(오늘(KST), 현재 종료일 + 1일) */
export function getBusinessPeriodExtendMinDate(
  currentEndDate: string | Date | null | undefined,
  now: Date = new Date()
): string | null {
  const today = seoulCalendarDateKey(now)
  if (!today) return null
  const current = seoulCalendarDateKey(currentEndDate)
  const nextAfterCurrent = current ? addOneCalendarDay(current) : null
  if (!nextAfterCurrent) return today
  return maxYmd(today, nextAfterCurrent)
}

export function isProgramBusinessPeriodEnded(
  businessEndDate: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (businessEndDate == null) return false
  if (typeof businessEndDate === 'string' && !businessEndDate.trim()) return false
  return !isCommonInfoEditPeriodOpen(businessEndDate, now)
}

export function hasProgramEditPermission(user: Omit<User, 'password'> | null): boolean {
  if (!canPerformWriteAction(user)) return false
  const codes = user?.permissionCodes
  if (codes == null || codes.length === 0) return true
  return PROGRAM_EDIT_PERMISSION_CODES.some(code => codes.includes(code))
}

export function canShowBusinessPeriodExtendButton(
  program: Program | null | undefined,
  user: Omit<User, 'password'> | null,
  now: Date = new Date()
): boolean {
  if (!isBusinessPeriodExtendUiEnabled()) return false
  if (!program) return false
  if (!hasProgramEditPermission(user)) return false
  return isProgramBusinessPeriodEnded(program.endDate, now)
}

export function businessPeriodExtendConfirmCopy(newEndDate: string): string {
  return `종료일을 ${newEndDate}로 연장하면 강의 보고서 제출과 정산 신청이 다시 열립니다.`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function parseBusinessPeriodHistoryItem(
  value: unknown
): ProgramBusinessPeriodHistoryItem | null {
  const record = asRecord(value)
  if (!record) return null
  const previousBusinessEndDate = readOptionalString(record.previousBusinessEndDate)
  const businessEndDate = readOptionalString(record.businessEndDate)
  const reason = readOptionalString(record.reason) ?? null
  const changedByName = readOptionalString(record.changedByName) ?? null
  const changedAt = readOptionalString(record.changedAt) ?? null
  if (!previousBusinessEndDate && !businessEndDate && !changedAt && !changedByName && !reason) {
    return null
  }
  return {
    previousBusinessEndDate: previousBusinessEndDate ?? null,
    businessEndDate: businessEndDate ?? null,
    reason,
    changedByName,
    changedAt,
  }
}

export function parseBusinessPeriodHistories(source: unknown): ProgramBusinessPeriodHistoryItem[] {
  const record = asRecord(source)
  if (!record) return []
  const raw = record.businessPeriodHistories
  if (!Array.isArray(raw)) {
    const single = parseBusinessPeriodHistoryItem(record)
    return single && (single.previousBusinessEndDate || single.businessEndDate) ? [single] : []
  }
  return raw
    .map(parseBusinessPeriodHistoryItem)
    .filter((row): row is ProgramBusinessPeriodHistoryItem => row != null)
}

export function applyBusinessPeriodHistoriesFromDto<T extends Program>(
  program: T,
  dto: unknown
): T {
  const histories = parseBusinessPeriodHistories(dto)
  if (histories.length === 0) return program
  return { ...program, businessPeriodHistories: histories }
}
