import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { EmployeeVolunteerCountEntryResponse } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountEntryResponse'
import type { EmployeeVolunteerCountReplaceRequest } from '@/shared/api/generated/program-progress/schemas/employeeVolunteerCountReplaceRequest'
import type {
  EmployeeVolunteerSessionRow,
  EmployeeVolunteerSessionRowId,
} from '@/features/program/general/lib/employee-volunteer-session-rows'
import type { EmployeeVolunteerSessionCounts } from '@/features/program/general/lib/employee-volunteer-registration'

const EMPLOYEE_VOLUNTEER_COUNT_PUT_REASON = 'CMS 참여 봉사자 임직원 자원봉사자 인원 등록'

function sortedSchedules(
  schedules: DashboardProgramScheduleResponse[]
): DashboardProgramScheduleResponse[] {
  return [...schedules]
    .filter(s => s.scheduleId != null)
    .sort((a, b) => (a.sessionNo ?? 0) - (b.sessionNo ?? 0))
}

function isPreEducationScheduleName(scheduleName: string | undefined): boolean {
  return (scheduleName ?? '').includes('사전')
}

/**
 * 프로그램 구조 기반 모달 행 ↔ dashboard scheduleId 매핑.
 * sessionNo가 있으면 회차(round)와 우선 매칭하고, 없으면 사전교육 제외 정렬 인덱스로 매칭한다.
 */
export function buildEmployeeVolunteerSessionRowScheduleMap(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  schedules: DashboardProgramScheduleResponse[]
): Map<EmployeeVolunteerSessionRowId, number> {
  const ordered = sortedSchedules(schedules)
  const map = new Map<EmployeeVolunteerSessionRowId, number>()
  if (ordered.length === 0) return map

  const preEducationSchedule =
    ordered.find(s => isPreEducationScheduleName(s.scheduleName)) ?? ordered[0]
  const regularSchedules = ordered.filter(
    s => s.scheduleId !== preEducationSchedule?.scheduleId && !isPreEducationScheduleName(s.scheduleName)
  )

  for (const row of sessionRows) {
    if (row.id === 'pre_education') {
      if (preEducationSchedule?.scheduleId != null) {
        map.set(row.id, preEducationSchedule.scheduleId)
      }
      continue
    }
    if (row.id === 'program_progress') {
      const schedule = regularSchedules[0] ?? ordered[0]
      if (schedule?.scheduleId != null) map.set(row.id, schedule.scheduleId)
      continue
    }
    if (row.round != null) {
      const bySessionNo = regularSchedules.find(s => s.sessionNo === row.round)
      const byIndex = regularSchedules[row.round - 1] ?? ordered[row.round - 1]
      const schedule = bySessionNo ?? byIndex ?? ordered[0]
      if (schedule?.scheduleId != null) map.set(row.id, schedule.scheduleId)
    }
  }

  return map
}

export function mapEmployeeVolunteerCountsGetToSessionCounts(
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>,
  schedules: DashboardProgramScheduleResponse[],
  entries: EmployeeVolunteerCountEntryResponse[] | undefined
): Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>> {
  const rowToScheduleId = buildEmployeeVolunteerSessionRowScheduleMap(sessionRows, schedules)
  const entryByScheduleId = new Map<number, EmployeeVolunteerCountEntryResponse>()
  for (const entry of entries ?? []) {
    if (entry.scheduleId == null) continue
    entryByScheduleId.set(entry.scheduleId, entry)
  }

  const counts: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>> = {}
  for (const row of sessionRows) {
    const scheduleId = rowToScheduleId.get(row.id)
    if (scheduleId == null) continue
    const entry = entryByScheduleId.get(scheduleId)
    counts[row.id] = {
      newCount: entry?.newVolunteerCount ?? 0,
      returningCount: entry?.reparticipationVolunteerCount ?? 0,
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
  const rowToScheduleId = buildEmployeeVolunteerSessionRowScheduleMap(
    params.sessionRows,
    params.schedules
  )
  const revisionByScheduleId = new Map<number, number>()
  for (const entry of params.previousEntries ?? []) {
    if (entry.scheduleId == null || entry.revision == null) continue
    revisionByScheduleId.set(entry.scheduleId, entry.revision)
  }

  const entries: EmployeeVolunteerCountReplaceRequest['entries'] = []
  for (const row of params.sessionRows) {
    const scheduleId = rowToScheduleId.get(row.id)
    if (scheduleId == null) continue
    const counts = params.countsBySessionId[row.id]
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
