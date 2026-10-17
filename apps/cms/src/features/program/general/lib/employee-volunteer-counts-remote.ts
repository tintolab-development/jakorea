import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { EmployeeVolunteerCountEntryResponse } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountEntryResponse'
import type { EmployeeVolunteerCountReplaceRequest } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountReplaceRequest'
import type {
  EmployeeVolunteerSessionRow,
  EmployeeVolunteerSessionRowId,
} from '@/features/program/general/lib/employee-volunteer-session-rows'
import type { EmployeeVolunteerSessionCounts } from '@/features/program/general/lib/employee-volunteer-registration'

const EMPLOYEE_VOLUNTEER_COUNT_PUT_REASON = 'CMS 참여 봉사자 임직원 자원봉사자 인원 등록'

export class EmployeeVolunteerScheduleMappingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmployeeVolunteerScheduleMappingError'
  }
}

function sortedSchedules(
  schedules: DashboardProgramScheduleResponse[]
): DashboardProgramScheduleResponse[] {
  return [...schedules]
    .filter(s => s.scheduleId != null)
    .sort((a, b) => (a.sessionNo ?? 0) - (b.sessionNo ?? 0))
}

function normalizeScheduleLabel(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ')
}

/** 사전교육 일정 — 한글 「사전」 포함만 (Orientation 등 일반 일정과 구분) */
function isPreEducationScheduleName(scheduleName: string | undefined): boolean {
  return normalizeScheduleLabel(scheduleName).includes('사전')
}

function scheduleMatchesRowLabel(
  scheduleName: string | undefined,
  row: EmployeeVolunteerSessionRow
): boolean {
  const name = normalizeScheduleLabel(scheduleName)
  if (!name) return false
  if (row.id === 'pre_education') return isPreEducationScheduleName(name)
  if (row.isPreEducation) return isPreEducationScheduleName(name)
  return name === normalizeScheduleLabel(row.label)
}

function findUniqueScheduleIdByNameMatch(
  candidates: ReadonlyArray<{ scheduleId?: number; scheduleName?: string }>,
  row: EmployeeVolunteerSessionRow
): number | undefined {
  const matched = candidates.filter(
    candidate =>
      candidate.scheduleId != null && scheduleMatchesRowLabel(candidate.scheduleName, row)
  )
  if (matched.length !== 1) return undefined
  return matched[0]?.scheduleId
}

function resolveScheduleIdForRow(
  row: EmployeeVolunteerSessionRow,
  regularSchedules: DashboardProgramScheduleResponse[],
  preEducationSchedule: DashboardProgramScheduleResponse | undefined,
  employeeVolunteerEntries?: EmployeeVolunteerCountEntryResponse[]
): number | undefined {
  if (row.id === 'pre_education') {
    const fromEntries = employeeVolunteerEntries
      ? findUniqueScheduleIdByNameMatch(employeeVolunteerEntries, row)
      : undefined
    if (fromEntries != null) return fromEntries
    return preEducationSchedule?.scheduleId ?? undefined
  }

  if (row.id === 'program_progress') {
    const fromEntries = employeeVolunteerEntries
      ? findUniqueScheduleIdByNameMatch(
          employeeVolunteerEntries.filter(e => !isPreEducationScheduleName(e.scheduleName)),
          row
        )
      : undefined
    if (fromEntries != null) return fromEntries
    const fromDashboardName = findUniqueScheduleIdByNameMatch(regularSchedules, row)
    if (fromDashboardName != null) return fromDashboardName
    return undefined
  }

  if (row.round == null) return undefined

  const fromEntries = employeeVolunteerEntries
    ? findUniqueScheduleIdByNameMatch(
        employeeVolunteerEntries.filter(e => !isPreEducationScheduleName(e.scheduleName)),
        row
      )
    : undefined
  if (fromEntries != null) return fromEntries

  const fromDashboardName = findUniqueScheduleIdByNameMatch(regularSchedules, row)
  if (fromDashboardName != null) return fromDashboardName

  const bySessionNo = regularSchedules.filter(s => s.sessionNo === row.round)
  if (bySessionNo.length === 1 && bySessionNo[0]?.scheduleId != null) {
    return bySessionNo[0].scheduleId
  }

  const byIndex = regularSchedules[row.round - 1]
  if (bySessionNo.length === 0 && byIndex?.scheduleId != null) {
    const sameSessionNoCount = regularSchedules.filter(
      s => s.sessionNo === byIndex.sessionNo
    ).length
    if (sameSessionNoCount <= 1) return byIndex.scheduleId
  }

  return undefined
}

/**
 * 프로그램 구조 기반 모달 행 ↔ scheduleId 매핑.
 * GET entries.scheduleName · dashboard scheduleName 우선, sessionNo는 유일할 때만 보조.
 */
export function buildEmployeeVolunteerSessionRowScheduleMap(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  schedules: DashboardProgramScheduleResponse[],
  employeeVolunteerEntries?: EmployeeVolunteerCountEntryResponse[]
): Map<EmployeeVolunteerSessionRowId, number> {
  const ordered = sortedSchedules(schedules)
  const map = new Map<EmployeeVolunteerSessionRowId, number>()
  if (ordered.length === 0 && (employeeVolunteerEntries?.length ?? 0) === 0) return map

  const preEducationSchedule = ordered.find(s => isPreEducationScheduleName(s.scheduleName))
  const regularSchedules = ordered.filter(
    s =>
      s.scheduleId !== preEducationSchedule?.scheduleId &&
      !isPreEducationScheduleName(s.scheduleName)
  )

  for (const row of sessionRows) {
    const scheduleId = resolveScheduleIdForRow(
      row,
      regularSchedules,
      preEducationSchedule,
      employeeVolunteerEntries
    )
    if (scheduleId != null) map.set(row.id, scheduleId)
  }

  return map
}

function buildScheduleIdToRowIdMap(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  schedules: DashboardProgramScheduleResponse[],
  employeeVolunteerEntries?: EmployeeVolunteerCountEntryResponse[]
): Map<number, EmployeeVolunteerSessionRowId> {
  const rowToScheduleId = buildEmployeeVolunteerSessionRowScheduleMap(
    sessionRows,
    schedules,
    employeeVolunteerEntries
  )
  const scheduleIdToRowId = new Map<number, EmployeeVolunteerSessionRowId>()

  for (const row of sessionRows) {
    const scheduleId = rowToScheduleId.get(row.id)
    if (scheduleId == null) {
      throw new EmployeeVolunteerScheduleMappingError(
        `교육 일정과 서버 일정을 연결하지 못했습니다. (${row.label}) 화면을 닫은 뒤 다시 시도하거나 관리자에게 문의해 주세요.`
      )
    }
    if (scheduleIdToRowId.has(scheduleId)) {
      throw new EmployeeVolunteerScheduleMappingError(
        '교육 일정이 서버 일정과 중복 연결되었습니다. 프로그램 일정 구성을 확인한 뒤 다시 시도해 주세요.'
      )
    }
    scheduleIdToRowId.set(scheduleId, row.id)
  }

  return scheduleIdToRowId
}

export function mapEmployeeVolunteerCountsGetToSessionCounts(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  schedules: DashboardProgramScheduleResponse[],
  entries: EmployeeVolunteerCountEntryResponse[] | undefined
): Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>> {
  const rowToScheduleId = buildEmployeeVolunteerSessionRowScheduleMap(
    sessionRows,
    schedules,
    entries
  )
  const entryByScheduleId = new Map<number, EmployeeVolunteerCountEntryResponse>()
  for (const entry of entries ?? []) {
    if (entry.scheduleId == null) continue
    entryByScheduleId.set(entry.scheduleId, entry)
  }

  const counts: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>> = {}
  for (const row of sessionRows) {
    const scheduleId = rowToScheduleId.get(row.id)
    if (scheduleId == null) {
      counts[row.id] = {}
      continue
    }
    const entry = entryByScheduleId.get(scheduleId)
    if (!entry || entry.confirmed !== true) {
      counts[row.id] = {}
      continue
    }
    counts[row.id] = {
      newCount: entry.newVolunteerCount ?? 0,
      returningCount: entry.reparticipationVolunteerCount ?? 0,
    }
  }
  return counts
}

export function buildEmployeeVolunteerCountsPutRequest(params: {
  organizationApplicationId?: number
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>
  schedules: DashboardProgramScheduleResponse[]
  countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
  previousEntries?: EmployeeVolunteerCountEntryResponse[]
}): EmployeeVolunteerCountReplaceRequest {
  const scheduleIdToRowId = buildScheduleIdToRowIdMap(
    params.sessionRows,
    params.schedules,
    params.previousEntries
  )
  const mappedScheduleIds = new Set(scheduleIdToRowId.keys())

  const revisionByScheduleId = new Map<number, number>()
  for (const entry of params.previousEntries ?? []) {
    if (entry.scheduleId == null || entry.revision == null) continue
    revisionByScheduleId.set(entry.scheduleId, entry.revision)
  }

  const serverScheduleIds = (params.previousEntries ?? [])
    .map(entry => entry.scheduleId)
    .filter((id): id is number => id != null)

  const targetScheduleIds =
    serverScheduleIds.length > 0 ? serverScheduleIds : [...mappedScheduleIds]

  const unmappedOnServer = targetScheduleIds.filter(id => !mappedScheduleIds.has(id))
  if (unmappedOnServer.length > 0) {
    throw new EmployeeVolunteerScheduleMappingError(
      '서버에 등록된 교육 일정과 화면 일정이 일치하지 않습니다. 화면을 닫은 뒤 다시 열어 최신 일정을 불러온 후 저장해 주세요.'
    )
  }

  if (serverScheduleIds.length > 0) {
    const serverSet = new Set(serverScheduleIds)
    const missingOnServer = [...mappedScheduleIds].filter(id => !serverSet.has(id))
    if (missingOnServer.length > 0) {
      throw new EmployeeVolunteerScheduleMappingError(
        '화면에 표시된 교육 일정이 서버 일정 목록에 없습니다. 프로그램 일정을 확인한 뒤 다시 시도해 주세요.'
      )
    }
  }

  const entries: EmployeeVolunteerCountReplaceRequest['entries'] = []
  for (const scheduleId of targetScheduleIds) {
    const rowId = scheduleIdToRowId.get(scheduleId)
    const counts = rowId ? params.countsBySessionId[rowId] : undefined
    entries.push({
      scheduleId,
      newVolunteerCount: counts?.newCount ?? 0,
      reparticipationVolunteerCount: counts?.returningCount ?? 0,
      expectedRevision: revisionByScheduleId.get(scheduleId) ?? 0,
    })
  }

  return {
    organizationApplicationId: params.organizationApplicationId,
    entries,
    reason: EMPLOYEE_VOLUNTEER_COUNT_PUT_REASON,
  }
}
