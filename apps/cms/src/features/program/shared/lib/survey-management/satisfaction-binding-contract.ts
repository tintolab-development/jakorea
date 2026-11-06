import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { SurveyProgressStatus } from './survey-management-types'

export const SATISFACTION_RUN_MODE_PER_SCHEDULE = 'PER_SCHEDULE' as const
export const SATISFACTION_RUN_MODE_ONCE_AT_END = 'ONCE_AT_END' as const

export type SatisfactionRunMode =
  | typeof SATISFACTION_RUN_MODE_PER_SCHEDULE
  | typeof SATISFACTION_RUN_MODE_ONCE_AT_END

export const SATISFACTION_WINDOW_DAYS = [3, 7, 14, 30] as const
export type SatisfactionWindowDays = (typeof SATISFACTION_WINDOW_DAYS)[number]

export const DEFAULT_SATISFACTION_WINDOW_DAYS: SatisfactionWindowDays = 7

export type SatisfactionBindingWriteFields = {
  satisfactionRunMode?: SatisfactionRunMode
  satisfactionWindowDays?: SatisfactionWindowDays
  startAtLocked?: boolean
  startImmediately?: boolean
}

export type SatisfactionFormBindingRequest = ProgramFormBindingRequest &
  SatisfactionBindingWriteFields

export type SatisfactionBindingReadFields = SatisfactionBindingWriteFields & {
  displayDeadlineAt?: string | null
  resultDownloadable?: boolean | null
  progressStatus?: string | null
}

export type SatisfactionFormBindingResponse = ProgramFormBindingResponse &
  SatisfactionBindingReadFields

export function isSatisfactionWindowDays(value: unknown): value is SatisfactionWindowDays {
  return SATISFACTION_WINDOW_DAYS.includes(value as SatisfactionWindowDays)
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
/** 등록 모달 예시 — 1회차 종료일(11.12 목) */
const SATISFACTION_WINDOW_EXAMPLE_SESSION_END = { year: 2026, month: 11, day: 12 } as const

function formatSatisfactionExampleDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}(${KO_WEEKDAYS[date.getDay()]})`
}

/** 참여 기간 선택에 맞춰 등록 모달 예시 마감일을 만든다. 3일 → 11.12~11.15, 7일 → 11.12~11.19 */
export function formatSatisfactionWindowExampleLine(windowDays: number): string {
  const { year, month, day } = SATISFACTION_WINDOW_EXAMPLE_SESSION_END
  const sessionEnd = formatSatisfactionExampleDate(year, month, day)
  const deadline = new Date(year, month - 1, day + windowDays)
  const deadlineLabel = formatSatisfactionExampleDate(
    deadline.getFullYear(),
    deadline.getMonth() + 1,
    deadline.getDate()
  )
  return `예) 1회차 ${sessionEnd} 12:00 종료 → ${deadlineLabel} 23:59 마감`
}

export function readSatisfactionRunMode(
  value: unknown,
  fallbackScope?: string | null
): SatisfactionRunMode | null {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (raw === SATISFACTION_RUN_MODE_PER_SCHEDULE) return SATISFACTION_RUN_MODE_PER_SCHEDULE
  if (raw === SATISFACTION_RUN_MODE_ONCE_AT_END) return SATISFACTION_RUN_MODE_ONCE_AT_END
  const scope = fallbackScope?.trim().toUpperCase()
  if (scope === 'SCHEDULE') return SATISFACTION_RUN_MODE_PER_SCHEDULE
  if (scope === 'PROGRAM') return SATISFACTION_RUN_MODE_ONCE_AT_END
  return null
}

export function readSatisfactionWindowDays(value: unknown): SatisfactionWindowDays | null {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN
  if (!Number.isFinite(numeric)) return null
  const days = Math.trunc(numeric)
  return isSatisfactionWindowDays(days) ? days : null
}

export function readSatisfactionBindingFields(
  binding: ProgramFormBindingResponse | null | undefined
): SatisfactionBindingReadFields {
  const row = (binding ?? {}) as SatisfactionFormBindingResponse
  return {
    satisfactionRunMode:
      readSatisfactionRunMode(row.satisfactionRunMode, row.targetScope) ?? undefined,
    satisfactionWindowDays: readSatisfactionWindowDays(row.satisfactionWindowDays) ?? undefined,
    startAtLocked: typeof row.startAtLocked === 'boolean' ? row.startAtLocked : undefined,
    startImmediately: typeof row.startImmediately === 'boolean' ? row.startImmediately : undefined,
    displayDeadlineAt: typeof row.displayDeadlineAt === 'string' ? row.displayDeadlineAt : null,
    resultDownloadable: typeof row.resultDownloadable === 'boolean' ? row.resultDownloadable : null,
    progressStatus: typeof row.progressStatus === 'string' ? row.progressStatus : null,
  }
}

export function mapSatisfactionProgressStatus(
  binding: ProgramFormBindingResponse | null | undefined,
  fallback: SurveyProgressStatus
): SurveyProgressStatus {
  const raw = readSatisfactionBindingFields(binding).progressStatus?.trim().toUpperCase()
  if (raw === 'BEFORE_START') return 'before_start'
  if (raw === 'IN_PROGRESS') return 'in_progress'
  if (raw === 'FINISHED') return 'finished'
  return fallback
}

/** SATISFACTION 결과 다운로드 — 진행 후 항상 가능. `resultDownloadable`로 막지 않는다. */
export function canDownloadSatisfactionResults(
  _input?: { resultDownloadable?: boolean | null }
): boolean {
  return true
}

export function satisfactionBindingRowKey(input: {
  bindingId?: string | number | null
  targetScopeId?: number | null
}): string {
  const bindingId = input.bindingId == null ? '' : String(input.bindingId).trim()
  const scopeId =
    typeof input.targetScopeId === 'number' && Number.isFinite(input.targetScopeId)
      ? String(Math.trunc(input.targetScopeId))
      : ''
  return `${bindingId}:${scopeId}`
}

export function satisfactionScheduleLabel(input: {
  targetScope?: string | null
  targetScopeLabel?: string | null
}): string {
  const label = input.targetScopeLabel?.trim()
  if (label) return label
  if (input.targetScope?.trim().toUpperCase() === 'PROGRAM') return '종료 시 1회'
  return '일정'
}

export function buildSatisfactionBindingWriteFields(input: {
  runMode: SatisfactionRunMode
  windowDays: SatisfactionWindowDays
  startImmediately: boolean
  startAtLocked: boolean
}): SatisfactionBindingWriteFields {
  return {
    satisfactionRunMode: input.runMode,
    satisfactionWindowDays: input.windowDays,
    startImmediately: input.startImmediately,
    startAtLocked: input.startAtLocked,
  }
}
