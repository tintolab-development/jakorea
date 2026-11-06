import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type {
  SurveyProgressStatus,
  SurveyQuestionOptionCount,
  SurveyResultQuestionSummary,
} from './survey-management-types'

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

export function isSatisfactionWindowDays(
  value: unknown
): value is SatisfactionWindowDays {
  return SATISFACTION_WINDOW_DAYS.includes(value as SatisfactionWindowDays)
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
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const days = Math.trunc(value)
  return isSatisfactionWindowDays(days) ? days : null
}

export function readSatisfactionBindingFields(
  binding: ProgramFormBindingResponse | null | undefined
): SatisfactionBindingReadFields {
  const row = (binding ?? {}) as SatisfactionFormBindingResponse
  return {
    satisfactionRunMode: readSatisfactionRunMode(row.satisfactionRunMode, row.targetScope) ?? undefined,
    satisfactionWindowDays: readSatisfactionWindowDays(row.satisfactionWindowDays) ?? undefined,
    startAtLocked: typeof row.startAtLocked === 'boolean' ? row.startAtLocked : undefined,
    startImmediately: typeof row.startImmediately === 'boolean' ? row.startImmediately : undefined,
    displayDeadlineAt:
      typeof row.displayDeadlineAt === 'string' ? row.displayDeadlineAt : null,
    resultDownloadable:
      typeof row.resultDownloadable === 'boolean' ? row.resultDownloadable : null,
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

/** SATISFACTION 결과 다운로드 — `resultDownloadable === true`만. 제출 완료율로 켜지 않는다. */
export function canDownloadSatisfactionResults(input: {
  resultDownloadable?: boolean | null
}): boolean {
  return input.resultDownloadable === true
}

export function canDownloadSatisfactionAggregate(
  bindings: ReadonlyArray<{ resultDownloadable?: boolean | null }>
): boolean {
  if (bindings.length === 0) return false
  return bindings.every(item => canDownloadSatisfactionResults(item))
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

export type SatisfactionAggregateCounts = {
  submittedCount: number
  expectedRespondentCount: number | null
}

/** expected가 하나라도 null이면 합산 분모도 null — 제출률을 숨긴다. */
export function aggregateSatisfactionCounts(
  rows: ReadonlyArray<{ responseCount?: number; expectedRespondentCount?: number | null }>
): SatisfactionAggregateCounts {
  let submitted = 0
  let expected = 0
  let missingExpected = false
  for (const row of rows) {
    submitted += Number.isFinite(row.responseCount) ? Number(row.responseCount) : 0
    if (row.expectedRespondentCount == null) {
      missingExpected = true
      continue
    }
    expected += row.expectedRespondentCount
  }
  return {
    submittedCount: submitted,
    expectedRespondentCount: missingExpected ? null : expected,
  }
}

function cloneQuestionOptions(
  options: SurveyQuestionOptionCount[] | undefined
): SurveyQuestionOptionCount[] | undefined {
  if (options == null) return undefined
  return options.map(option => ({ ...option }))
}

/** 일정별 summary `options.count`를 questionKey·option value 기준으로 더한다. */
export function mergeSatisfactionQuestionSummaries(
  groups: ReadonlyArray<SurveyResultQuestionSummary[] | null | undefined>
): SurveyResultQuestionSummary[] {
  const byKey = new Map<string, SurveyResultQuestionSummary>()
  const order: string[] = []
  for (const group of groups) {
    if (group == null) continue
    for (const question of group) {
      const key = question.questionKey.trim()
      if (!key) continue
      const existing = byKey.get(key)
      if (existing == null) {
        byKey.set(key, {
          ...question,
          options: cloneQuestionOptions(question.options),
        })
        order.push(key)
        continue
      }
      if (existing.options == null && question.options == null) continue
      const optionMap = new Map<string, SurveyQuestionOptionCount>()
      for (const option of existing.options ?? []) {
        optionMap.set(option.value, { ...option })
      }
      for (const option of question.options ?? []) {
        const prev = optionMap.get(option.value)
        if (prev == null) {
          optionMap.set(option.value, { ...option })
          continue
        }
        optionMap.set(option.value, { ...prev, count: prev.count + option.count })
      }
      existing.options = [...optionMap.values()].sort((a, b) => a.displayOrder - b.displayOrder)
    }
  }
  return order.map(key => byKey.get(key)).filter((row): row is SurveyResultQuestionSummary => row != null)
}

export function satisfactionDeadlinePreviewCopy(windowDays: SatisfactionWindowDays): string {
  return `화면 마감은 시작일로부터 ${windowDays}일째 23:59:59(Asia/Seoul)입니다. 사업 운영 종료가 더 빠르면 그 시각이 최종 마감입니다.`
}

export function satisfactionStartHintCopy(runMode: SatisfactionRunMode): string {
  return runMode === SATISFACTION_RUN_MODE_ONCE_AT_END
    ? '기본 시작일은 마지막 교육 일정 종료일입니다. 관리자가 시작을 직접 지정하면 이후 일정 변경이 덮어쓰지 않습니다.'
    : '기본 시작은 해당 일정 종료 시각입니다.'
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
