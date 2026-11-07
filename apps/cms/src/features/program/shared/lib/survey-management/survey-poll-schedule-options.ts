import dayjs, { type Dayjs } from 'dayjs'
import {
  appendEducationRoundSuffix,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { normalizeEducationScheduleLineForView } from '@/features/program/general/lib/education-schedule-lines-display'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import {
  isMultiDayAllDayPeriodWindowForSurvey,
  readProgramScheduleCanonicalFields,
} from '@/features/program/shared/lib/program-schedule-canonical'
import {
  PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED,
  PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED,
  PROGRAM_SCHEDULE_ORIGIN_UNKNOWN,
  readProgramScheduleOrigin,
} from '@/features/program/shared/lib/program-schedule-origin'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { Program } from '@/types/domain'

/** 설문 대상 「전체」 — 바인딩 targetScope PROGRAM */
export const SURVEY_POLL_TARGET_ALL_VALUE = 'PROGRAM'

export type SurveyPollScheduleSelectOption = {
  label: string
  value: string
  /** 이미 설문이 연결된 일정 — 회색 비활성(선택 불가) */
  disabled?: boolean
}

/** 서버 form-binding 중 일정 사용 여부 판단에 필요한 필드 */
export type SurveyPollScheduleBindingRef = {
  binding: {
    formType?: string | null
    targetRole?: string | null
    targetType?: string | null
    targetScope?: string | null
    targetScopeId?: number | null
    active?: boolean | null
  }
}

export type SurveyPollUsedScheduleFilter = {
  formType?: string
  targetRole?: string
}

/** 활성 formType + SCHEDULE 바인딩이 이미 있는 scheduleId 집합 (서버 데이터만). 기본 formType=SURVEY. */
export function collectSurveyPollUsedScheduleIds(
  bindings: ReadonlyArray<SurveyPollScheduleBindingRef> | null | undefined,
  filter?: SurveyPollUsedScheduleFilter
): Set<string> {
  const formType = (filter?.formType ?? 'SURVEY').trim().toUpperCase()
  const targetRole = filter?.targetRole?.trim().toUpperCase()
  const used = new Set<string>()
  for (const { binding } of bindings ?? []) {
    if (binding.active === false) continue
    if (binding.formType?.trim().toUpperCase() !== formType) continue
    if (targetRole) {
      const role = (binding.targetRole ?? binding.targetType ?? '').trim().toUpperCase()
      if (role !== targetRole) continue
    }
    if (binding.targetScope?.trim().toUpperCase() !== 'SCHEDULE') continue
    const id = binding.targetScopeId
    if (typeof id !== 'number' || !Number.isFinite(id) || id < 1) continue
    used.add(String(Math.trunc(id)))
  }
  return used
}

export const SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE = '이미 설문이 등록된 일정입니다.'

/** 일정 필드가 숨겨진 자동 바인딩 대상이 이미 설문이 있는 SCHEDULE이면 true. PROGRAM 범위는 false. */
export function isSurveyPollBindingTargetScheduleAlreadyRegistered(
  target: { targetScope?: string | null; targetScopeId?: number | null } | null | undefined,
  bindings: ReadonlyArray<SurveyPollScheduleBindingRef> | null | undefined,
  filter?: SurveyPollUsedScheduleFilter
): boolean {
  if (target?.targetScope?.trim().toUpperCase() !== 'SCHEDULE') return false
  const id = target.targetScopeId
  if (typeof id !== 'number' || !Number.isFinite(id) || id < 1) return false
  return collectSurveyPollUsedScheduleIds(bindings, filter).has(String(Math.trunc(id)))
}

/** 이미 설문이 있는 일정은 노출은 유지하고 disabled만 켠다. 라벨·value는 그대로. */
export function disableSurveyPollScheduleOptionsWithSurvey(
  options: ReadonlyArray<SurveyPollScheduleSelectOption>,
  bindings: ReadonlyArray<SurveyPollScheduleBindingRef> | null | undefined,
  filter?: SurveyPollUsedScheduleFilter
): SurveyPollScheduleSelectOption[] {
  const used = collectSurveyPollUsedScheduleIds(bindings, filter)
  if (used.size === 0) return [...options]
  return options.map(option => (used.has(option.value) ? { ...option, disabled: true } : option))
}

/** 아직 바인딩되지 않은 일정 value만. 일정별 만족도조사 자동 매핑에 사용한다. */
export function collectUnboundSurveyPollScheduleValues(
  options: ReadonlyArray<SurveyPollScheduleSelectOption>
): string[] {
  return options
    .filter(
      option =>
        option.disabled !== true &&
        option.value.trim() !== '' &&
        option.value !== SURVEY_POLL_TARGET_ALL_VALUE
    )
    .map(option => option.value)
}

/** TCH 행사별 — scheduleDetails 행사명 라벨 매칭 대상 (후보 소스는 education-slots만). */
export function isTrainedTeacherEventScheduleProgram(
  program: Program | null | undefined
): boolean {
  const backendType = program?.backendProgramType?.trim().toUpperCase()
  return (
    backendType === 'TRAINED_TEACHER' &&
    program?.generalProgramEducationStructure === 'schedule' &&
    program?.generalProgramSessionRound === 'multi'
  )
}

const GENERAL_PROGRAM_BACKEND_TYPES: ReadonlySet<string> = new Set([
  'GENERAL',
  'GENERAL_ORGANIZATION',
  'GENERAL_INDIVIDUAL',
])

/**
 * 일반 프로그램만 — BE programType 허용 목록. TT(TRAINED_TEACHER)·UJAT·1사1교·Gemini 등과
 * programType 미확인은 제외한다.
 */
export function isGeneralProgramForSurveyRoundLabel(
  program: Program | null | undefined
): boolean {
  const backendType = program?.backendProgramType?.trim().toUpperCase()
  return backendType != null && GENERAL_PROGRAM_BACKEND_TYPES.has(backendType)
}

function readPositiveScheduleId(schedule: ProgramScheduleResponse): number | null {
  const id = schedule.id
  if (typeof id !== 'number' || !Number.isFinite(id) || id < 1) return null
  return Math.trunc(id)
}

function normalizeRole(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase() ?? ''
  return trimmed || null
}

function normalizeStatus(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toUpperCase() ?? ''
  return trimmed || null
}

/**
 * 설문 SCHEDULE 후보 — education-slots row만.
 * `/schedules`·공통정보 합성 후보는 사용하지 않는다.
 */
export function isSurveyPollEducationSlotCandidate(schedule: unknown): boolean {
  if (schedule == null || typeof schedule !== 'object') return false
  const row = schedule as ProgramScheduleResponse
  if (readPositiveScheduleId(row) == null) return false
  if (isMultiDayAllDayPeriodWindowForSurvey(schedule)) return false

  const origin = readProgramScheduleOrigin(schedule)?.toUpperCase() ?? null
  if (origin === PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED) return false
  if (origin === PROGRAM_SCHEDULE_ORIGIN_UNKNOWN) return false
  if (origin !== PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED) return false

  const { scheduleRole, scheduleStatus } = readProgramScheduleCanonicalFields(schedule)
  const role = normalizeRole(scheduleRole)
  if (role !== 'EDUCATION' && role !== 'SESSION') return false
  if (normalizeStatus(scheduleStatus) !== 'ACTIVE') return false
  return true
}

export function filterSurveyPollEducationSlotCandidates<T>(
  schedules: ReadonlyArray<T>
): T[] {
  return schedules.filter(schedule => isSurveyPollEducationSlotCandidate(schedule))
}

export type SatisfactionScheduleSortKey = {
  startAt?: string | null
  sessionNo?: number | null
}

/** 만족도 결과 일정 셀렉트 — 날짜 오름차순, 같은 날이면 회차 오름차순 */
export function compareSatisfactionScheduleAsc(
  a: SatisfactionScheduleSortKey,
  b: SatisfactionScheduleSortKey
): number {
  const aStart = Date.parse(String(a.startAt ?? ''))
  const bStart = Date.parse(String(b.startAt ?? ''))
  const aOk = Number.isFinite(aStart)
  const bOk = Number.isFinite(bStart)
  if (aOk && bOk && aStart !== bStart) return aStart - bStart
  if (aOk !== bOk) return aOk ? -1 : 1
  const aSession =
    typeof a.sessionNo === 'number' && Number.isFinite(a.sessionNo)
      ? a.sessionNo
      : Number.POSITIVE_INFINITY
  const bSession =
    typeof b.sessionNo === 'number' && Number.isFinite(b.sessionNo)
      ? b.sessionNo
      : Number.POSITIVE_INFINITY
  if (aSession !== bSession) return aSession - bSession
  return 0
}

export function sortSatisfactionScheduleDisplayItemsAsc<T extends SatisfactionScheduleSortKey>(
  items: ReadonlyArray<T>
): T[] {
  return [...items].sort(compareSatisfactionScheduleAsc)
}

function sortSchedulesForSurveyPoll(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): ProgramScheduleResponse[] {
  return [...schedules].sort((a, b) => {
    const aStart = Date.parse(String(a.startAt ?? a.startDate ?? ''))
    const bStart = Date.parse(String(b.startAt ?? b.startDate ?? ''))
    const aOk = Number.isFinite(aStart)
    const bOk = Number.isFinite(bStart)
    if (aOk && bOk && aStart !== bStart) return aStart - bStart
    if (aOk !== bOk) return aOk ? -1 : 1
    const aSession = a.sessionNo ?? Number.MAX_SAFE_INTEGER
    const bSession = b.sessionNo ?? Number.MAX_SAFE_INTEGER
    if (aSession !== bSession) return aSession - bSession
    return (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER)
  })
}

/** 종료 시 1회 안내 — education-slots 중 마지막 교육 일정. */
export function pickLastSurveyPollEducationSlot(
  schedules: ReadonlyArray<ProgramScheduleResponse> | null | undefined
): ProgramScheduleResponse | null {
  const sorted = sortSchedulesForSurveyPoll(
    filterSurveyPollEducationSlotCandidates(schedules ?? [])
  )
  return sorted.at(-1) ?? null
}

function formatAdminScheduleAsCommonInfoEducationLine(
  schedule: ProgramScheduleResponse
): string {
  const startRaw = schedule.startAt ?? schedule.startDate
  const endRaw = schedule.endAt ?? schedule.endDate ?? startRaw
  if (!startRaw?.trim()) return ''
  const start = dayjs(startRaw)
  const end = dayjs(endRaw)
  if (!start.isValid()) return ''
  const endPoint = end.isValid() ? end : start
  return normalizeEducationScheduleLineForView(formatEducationScheduleLineFromRange([start, endPoint]))
}

/** education-slots API → 공통정보 「교육 진행 예정일」 한 줄 포맷 */
export function formatSurveyPollScheduleOptionLabel(
  schedule: ProgramScheduleResponse,
  _index: number
): string {
  const fromApi = formatAdminScheduleAsCommonInfoEducationLine(schedule)
  if (fromApi) return formatCmsScheduleDisplayLabel(fromApi)
  const sessionNo =
    typeof schedule.sessionNo === 'number' && Number.isFinite(schedule.sessionNo)
      ? schedule.sessionNo
      : _index + 1
  return toDisplayEducationScheduleName(schedule.scheduleName) || `${sessionNo}회차`
}

/**
 * 일반 프로그램 설문 옵션 — `일시 | N회차`. N은 일정에 저장된 sessionNo(목록 순서 아님).
 * sessionNo가 없거나 일시를 만들 수 없으면 기존 라벨 그대로.
 */
function withStoredSessionRoundSuffix(
  schedule: ProgramScheduleResponse,
  label: string
): string {
  if (!formatAdminScheduleAsCommonInfoEducationLine(schedule)) return label
  const sessionNo = schedule.sessionNo
  if (typeof sessionNo !== 'number' || !Number.isInteger(sessionNo) || sessionNo < 1) return label
  return appendEducationRoundSuffix(label, sessionNo)
}

function rangeMinuteKey(range: [Dayjs, Dayjs]): string {
  return `${range[0].valueOf()}:${range[1].valueOf()}`
}

function scheduleApiRange(schedule: ProgramScheduleResponse): [Dayjs, Dayjs] | null {
  const startRaw = schedule.startAt ?? schedule.startDate
  const endRaw = schedule.endAt ?? schedule.endDate ?? startRaw
  if (!startRaw?.trim()) return null
  const start = dayjs(startRaw)
  if (!start.isValid()) return null
  const end = dayjs(endRaw)
  return [start, end.isValid() ? end : start]
}

/**
 * scheduleDetails 행사명 — 배열 index가 아니라 scheduleDateLabel ↔ API 시각으로 매칭.
 */
export function resolveSurveyPollEventNameLabel(input: {
  schedule: ProgramScheduleResponse
  scheduleDetails: NonNullable<Program['generalCommonInfo']>['scheduleDetails']
}): string | null {
  const details = input.scheduleDetails ?? []
  if (details.length === 0) return null

  const apiRange = scheduleApiRange(input.schedule)
  const apiLine = formatAdminScheduleAsCommonInfoEducationLine(input.schedule)

  for (const detail of details) {
    const eventName = detail.name?.trim()
    if (!eventName) continue
    const dateLabel = detail.scheduleDateLabel?.trim()
    if (!dateLabel) continue

    const normalizedDetailLine = normalizeEducationScheduleLineForView(dateLabel)
    if (apiLine && normalizedDetailLine && apiLine === normalizedDetailLine) {
      return eventName
    }

    if (apiRange == null) continue
    const detailRange = parseEducationScheduleLineToRange(dateLabel)
    if (detailRange == null) continue
    if (rangeMinuteKey(apiRange) === rangeMinuteKey(detailRange)) {
      return eventName
    }
  }
  return null
}

/**
 * 설문 일정 후보 — education-slots만. `/schedules` fallback 없음.
 * @deprecated physicalSchedules 인자는 무시한다 (호환용).
 */
export function resolveSurveyPollScheduleCandidatesFromSources(input: {
  educationSlots: ReadonlyArray<ProgramScheduleResponse>
  physicalSchedules?: ReadonlyArray<ProgramScheduleResponse>
}): ProgramScheduleResponse[] {
  void input.physicalSchedules
  return filterSurveyPollEducationSlotCandidates(input.educationSlots)
}

/** education-slots(API id)만 설문 SCHEDULE 후보로 사용한다. */
export function buildSurveyPollScheduleSelectOptionsForProgram(
  program: Program,
  apiSchedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  const options = buildSurveyPollScheduleSelectOptions(apiSchedules, {
    appendStoredRoundSuffix: isGeneralProgramForSurveyRoundLabel(program),
  })
  if (!isTrainedTeacherEventScheduleProgram(program)) return options
  const details = program.generalCommonInfo?.scheduleDetails ?? []
  if (details.length === 0) return options

  const sorted = sortSchedulesForSurveyPoll(
    filterSurveyPollEducationSlotCandidates(apiSchedules)
  )
  return options.map(option => {
    const scheduleId = Number(option.value)
    const schedule = sorted.find(row => row.id === scheduleId)
    if (schedule == null) return option
    const eventName = resolveSurveyPollEventNameLabel({
      schedule,
      scheduleDetails: details,
    })
    if (!eventName) return option
    return { ...option, label: eventName }
  })
}

/** education-slots 응답만으로 옵션 구성 */
export function buildSurveyPollScheduleSelectOptions(
  schedules: ReadonlyArray<ProgramScheduleResponse>,
  options: { appendStoredRoundSuffix?: boolean } = {}
): SurveyPollScheduleSelectOption[] {
  const sorted = sortSchedulesForSurveyPoll(filterSurveyPollEducationSlotCandidates(schedules))
  const sessionOptions: SurveyPollScheduleSelectOption[] = []
  for (let index = 0; index < sorted.length; index += 1) {
    const schedule = sorted[index]
    const id = readPositiveScheduleId(schedule)
    if (id == null) continue
    const label = formatSurveyPollScheduleOptionLabel(schedule, index)
    sessionOptions.push({
      value: String(id),
      label: options.appendStoredRoundSuffix ? withStoredSessionRoundSuffix(schedule, label) : label,
    })
  }
  return sessionOptions
}
