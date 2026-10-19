import dayjs, { type Dayjs } from 'dayjs'
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
  return normalizeEducationScheduleLineForView(
    formatEducationScheduleLineFromRange([start, endPoint])
  )
}

/** education-slots API → 공통정보 「교육 진행 예정일」 한 줄 포맷 */
export function formatSurveyPollScheduleOptionLabel(
  schedule: ProgramScheduleResponse,
  _index: number
): string {
  const fromApi = formatAdminScheduleAsCommonInfoEducationLine(schedule)
  if (fromApi) return fromApi
  const sessionNo =
    typeof schedule.sessionNo === 'number' && Number.isFinite(schedule.sessionNo)
      ? schedule.sessionNo
      : _index + 1
  return schedule.scheduleName?.trim() || `${sessionNo}회차`
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
  const options = buildSurveyPollScheduleSelectOptions(apiSchedules)
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
  schedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  const sorted = sortSchedulesForSurveyPoll(filterSurveyPollEducationSlotCandidates(schedules))
  const sessionOptions: SurveyPollScheduleSelectOption[] = []
  for (let index = 0; index < sorted.length; index += 1) {
    const schedule = sorted[index]
    const id = readPositiveScheduleId(schedule)
    if (id == null) continue
    sessionOptions.push({
      value: String(id),
      label: formatSurveyPollScheduleOptionLabel(schedule, index),
    })
  }
  return sessionOptions
}
