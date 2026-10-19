import dayjs from 'dayjs'
import { normalizeEducationScheduleLineForView } from '@/features/program/general/lib/education-schedule-lines-display'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { filterProgramSchedulesForNewEducationAssignment } from '@/features/program/shared/lib/program-schedule-canonical'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { Program } from '@/types/domain'

/** 설문 대상 「전체」 — 바인딩 targetScope PROGRAM */
export const SURVEY_POLL_TARGET_ALL_VALUE = 'PROGRAM'

export type SurveyPollScheduleSelectOption = {
  label: string
  value: string
}

function sortSchedulesForSurveyPoll(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): ProgramScheduleResponse[] {
  return [...schedules].sort(
    (a, b) =>
      (a.sessionNo ?? Number.MAX_SAFE_INTEGER) - (b.sessionNo ?? Number.MAX_SAFE_INTEGER) ||
      (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER)
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

/** 프로그램 공통 교육 예정 슬롯(education-slots)만 설문 SCHEDULE 후보로 사용한다. */
export function buildSurveyPollScheduleSelectOptionsForProgram(
  _program: Program,
  apiSchedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  return buildSurveyPollScheduleSelectOptions(apiSchedules)
}

/** education-slots 응답만으로 옵션 구성 */
export function buildSurveyPollScheduleSelectOptions(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  const sorted = sortSchedulesForSurveyPoll(
    filterProgramSchedulesForNewEducationAssignment(schedules)
  )
  const sessionOptions: SurveyPollScheduleSelectOption[] = []
  for (let index = 0; index < sorted.length; index += 1) {
    const schedule = sorted[index]
    const id = schedule.id
    if (id == null || !Number.isFinite(id) || id < 1) continue
    sessionOptions.push({
      value: String(Math.trunc(id)),
      label: formatSurveyPollScheduleOptionLabel(schedule, index),
    })
  }
  return sessionOptions
}
