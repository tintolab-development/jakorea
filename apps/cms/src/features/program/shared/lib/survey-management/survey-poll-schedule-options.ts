import dayjs from 'dayjs'
import { buildEmployeeVolunteerSessionRowScheduleMap } from '@/features/program/general/lib/employee-volunteer-counts-remote'
import {
  resolveEmployeeVolunteerSessionRows,
  type EmployeeVolunteerSessionRow,
} from '@/features/program/general/lib/employee-volunteer-session-rows'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { inferScheduleDetailBlockKind } from '@/features/program/general/lib/schedule-detail-form'
import { isSurveyPollScheduleMultiEventProgram } from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import {
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { normalizeEducationScheduleLineForView } from '@/features/program/general/lib/education-schedule-lines-display'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { Program } from '@/types/domain'

/** 설문 대상 「전체」 — 바인딩 targetScope PROGRAM */
export const SURVEY_POLL_TARGET_ALL_VALUE = 'PROGRAM'

export type SurveyPollScheduleSelectOption = {
  label: string
  value: string
}

type MappableSessionRow = {
  row: EmployeeVolunteerSessionRow
  scheduleId: number
  mappableIndex: number
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

function mapAdminSchedulesToDashboard(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): DashboardProgramScheduleResponse[] {
  return schedules
    .filter(s => s.id != null && Number.isFinite(s.id) && s.id > 0)
    .map(s => ({
      scheduleId: Math.trunc(s.id!),
      sessionNo: s.sessionNo,
      scheduleName: s.scheduleName,
      startAt: s.startAt ?? s.startDate,
      endAt: s.endAt ?? s.endDate,
    }))
}

function buildScheduleByIdMap(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): Map<number, ProgramScheduleResponse> {
  const map = new Map<number, ProgramScheduleResponse>()
  for (const schedule of schedules) {
    const id = schedule.id
    if (id == null || !Number.isFinite(id) || id < 1) continue
    map.set(Math.trunc(id), schedule)
  }
  return map
}

function resolveEventScheduleRoundNumbers(program: Program): ReadonlySet<number> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const rounds = new Set<number>()
  let roundIndex = 0
  for (const detail of commonInfo.scheduleDetails ?? []) {
    if (detail.scheduleLabel?.includes('사전 교육')) continue
    roundIndex += 1
    if (inferScheduleDetailBlockKind(detail.scheduleLabel ?? '') === 'event') {
      rounds.add(roundIndex)
    }
  }
  return rounds
}

function collectMappableSessionRows(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  rowToScheduleId: Map<EmployeeVolunteerSessionRow['id'], number>,
  allowedRounds?: ReadonlySet<number>
): MappableSessionRow[] {
  const mappable: MappableSessionRow[] = []
  const usedScheduleIds = new Set<number>()

  for (const row of sessionRows) {
    if (
      allowedRounds != null &&
      (row.round == null || !allowedRounds.has(row.round))
    ) {
      continue
    }
    const scheduleId = rowToScheduleId.get(row.id)
    if (scheduleId == null || usedScheduleIds.has(scheduleId)) continue
    usedScheduleIds.add(scheduleId)
    mappable.push({
      row,
      scheduleId,
      mappableIndex: mappable.length,
    })
  }

  return mappable
}

function resolveEducationLineIndex(
  row: EmployeeVolunteerSessionRow,
  mappableIndex: number,
  mappableCount: number,
  lines: readonly string[]
): number | undefined {
  if (row.id === 'program_progress') {
    return lines.length > 0 ? 0 : undefined
  }
  if (row.id === 'pre_education') {
    const preIndex = lines.findIndex(line => line.includes('사전'))
    return preIndex >= 0 ? preIndex : undefined
  }
  if (mappableCount > 0 && lines.length === mappableCount) {
    return mappableIndex
  }
  if (row.round != null && row.round >= 1 && row.round <= lines.length) {
    return row.round - 1
  }
  return undefined
}

/** schedules API → 공통정보 「교육 진행 예정일」 한 줄 포맷 */
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

function resolveSurveyPollScheduleSelectLabel(
  row: EmployeeVolunteerSessionRow,
  scheduleId: number,
  mappableIndex: number,
  mappableCount: number,
  lines: readonly string[],
  scheduleById: Map<number, ProgramScheduleResponse>
): string {
  const lineIndex = resolveEducationLineIndex(row, mappableIndex, mappableCount, lines)
  if (lineIndex != null) {
    const fromCommon = lines[lineIndex]?.trim()
    if (fromCommon) return normalizeEducationScheduleLineForView(fromCommon)
  }
  const schedule = scheduleById.get(scheduleId)
  if (schedule != null) {
    const fromApi = formatAdminScheduleAsCommonInfoEducationLine(schedule)
    if (fromApi) return fromApi
  }
  return row.label
}

/**
 * 프로그램 공통정보·교육 진행 일정(임직원 봉사자 등록 모달과 동일 행) + schedules API id 매핑.
 * 라벨은 공통정보 educationScheduleLines(교육 진행 예정일) 형식과 동일.
 */
export function buildSurveyPollScheduleSelectOptionsForProgram(
  program: Program,
  apiSchedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  const dashboard = mapAdminSchedulesToDashboard(apiSchedules)
  const sessionRows = resolveEmployeeVolunteerSessionRows(program)
  const rowToScheduleId = buildEmployeeVolunteerSessionRowScheduleMap(sessionRows, dashboard)
  const eventRoundsOnly = isSurveyPollScheduleMultiEventProgram(bridge)
    ? resolveEventScheduleRoundNumbers(program)
    : undefined
  const mappableRows = collectMappableSessionRows(
    sessionRows,
    rowToScheduleId,
    eventRoundsOnly
  )
  const mappableCount = mappableRows.length

  const lines = resolveGeneralProgramCommonInfo(program).educationScheduleLines ?? []
  const scheduleById = buildScheduleByIdMap(apiSchedules)

  const sessionOptions: SurveyPollScheduleSelectOption[] = []
  for (const { row, scheduleId, mappableIndex } of mappableRows) {
    const label = resolveSurveyPollScheduleSelectLabel(
      row,
      scheduleId,
      mappableIndex,
      mappableCount,
      lines,
      scheduleById
    ).trim()
    if (!label) continue
    sessionOptions.push({
      value: String(scheduleId),
      label,
    })
  }

  if (sessionOptions.length === 0) {
    return buildSurveyPollScheduleSelectOptions(apiSchedules)
  }

  return sessionOptions
}

/** API 일정만으로 옵션 구성 — 프로그램 매핑 실패 시 폴백 */
export function buildSurveyPollScheduleSelectOptions(
  schedules: ReadonlyArray<ProgramScheduleResponse>
): SurveyPollScheduleSelectOption[] {
  const sorted = sortSchedulesForSurveyPoll(schedules)
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
