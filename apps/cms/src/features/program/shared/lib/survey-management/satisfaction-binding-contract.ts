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
  return `(ex. 1회차 ${sessionEnd} 12:00 종료 → ${deadlineLabel} 23:59 마감)`
}

export const SATISFACTION_ONCE_AT_END_PROGRAM_CLOSE_HINT =
  '만족도조사가 마감되면 프로그램이 종료 됩니다.'

/** ISO instant → 서울 달력 `11.26(목)`. UTC 날짜 슬라이스 금지. */
export function formatSatisfactionCompactSeoulDate(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  const stamp = dateOnly ? new Date(`${trimmed}T12:00:00+09:00`) : new Date(trimmed)
  if (Number.isNaN(stamp.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: '2-digit',
  }).formatToParts(stamp)
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  })
    .format(stamp)
    .replace('요일', '')
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!month || !day || !weekday) return null
  return `${month}.${day}(${weekday})`
}

/** 종료 시 1회 안내 괄호 — `3회차 11.26(목)` */
export function formatSatisfactionOnceAtEndScheduleLabel(input: {
  sessionNo?: number | null
  endAt?: string | null
  endDate?: string | null
  startAt?: string | null
  startDate?: string | null
}): string | null {
  const sessionNo =
    typeof input.sessionNo === 'number' && Number.isInteger(input.sessionNo) && input.sessionNo > 0
      ? input.sessionNo
      : null
  const date =
    formatSatisfactionCompactSeoulDate(input.endAt) ??
    formatSatisfactionCompactSeoulDate(input.endDate) ??
    formatSatisfactionCompactSeoulDate(input.startAt) ??
    formatSatisfactionCompactSeoulDate(input.startDate)
  if (sessionNo != null && date != null) return `${sessionNo}회차 ${date}`
  if (sessionNo != null) return `${sessionNo}회차`
  return date
}

export function formatSatisfactionOnceAtEndStartHint(scheduleLabel: string | null | undefined): string {
  const label = scheduleLabel?.trim() ?? ''
  if (label !== '') {
    return `마지막 교육 일정(${label})이 끝난 뒤에 시작할 수 있습니다.`
  }
  return '마지막 교육 일정이 끝난 뒤에 시작할 수 있습니다.'
}

/** 만족도조사 일정별 — 작성 기간은 일정 종료+참여 기간으로 고정, 인풋 비활성 */
export function isSatisfactionPerScheduleWritingPeriodLocked(input: {
  formType?: string | null
  runMode?: string | null
  targetScope?: string | null
}): boolean {
  if (input.formType?.trim().toUpperCase() !== 'SATISFACTION') return false
  return readSatisfactionRunMode(input.runMode, input.targetScope) === SATISFACTION_RUN_MODE_PER_SCHEDULE
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
