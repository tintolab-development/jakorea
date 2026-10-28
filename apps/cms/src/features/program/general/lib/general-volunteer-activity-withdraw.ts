import {
  buildEmployeeVolunteerSessionRowScheduleMap,
  mapAdminProgramSchedulesToDashboardShape,
} from '@/features/program/general/lib/employee-volunteer-counts-remote'
import {
  resolveEmployeeVolunteerSessionRows,
  type EmployeeVolunteerSessionRowId,
} from '@/features/program/general/lib/employee-volunteer-session-rows'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import {
  buildActivityWithdrawGuideDescription,
  type ActivityWithdrawScheduleOption,
} from '@/features/program/shared/lib/activity-withdraw-schedule'
import type { Program } from '@/types/domain'

export type GeneralVolunteerActivityWithdrawScheduleOption = ActivityWithdrawScheduleOption

/** 봉사자 활동 포기 모달 — 프로그램 교육 일정 선택지 */
export function getGeneralVolunteerActivityWithdrawScheduleOptions(
  program: Program
): ActivityWithdrawScheduleOption[] {
  return resolveEmployeeVolunteerSessionRows(program).map(row => ({
    value: row.id,
    label: row.label,
  }))
}

export function buildGeneralVolunteerScreeningActivityWithdrawDescription(
  volunteerName: string
): string {
  return buildActivityWithdrawGuideDescription(volunteerName, 'person')
}

export function buildGeneralVolunteerScreeningActivityWithdrawCompleteDescription(
  volunteerName: string
): string {
  const name = volunteerName.trim() || '신청자'
  return `[${name}] 님의 프로그램 활동이 포기 처리되었습니다.`
}

/** 신청 심사 활동 포기 — 모달 행 id → BE stopScheduleId */
export function resolveGeneralVolunteerActivityWithdrawStopScheduleId(
  program: Program,
  schedules: ReadonlyArray<AdminProgramScheduleResponse>,
  stopSessionKey: string
): number | undefined {
  const sessionRows = resolveEmployeeVolunteerSessionRows(program)
  const map = buildEmployeeVolunteerSessionRowScheduleMap(
    sessionRows,
    mapAdminProgramSchedulesToDashboardShape(schedules)
  )
  const scheduleId = map.get(stopSessionKey as EmployeeVolunteerSessionRowId)
  return scheduleId != null && Number.isFinite(scheduleId) ? scheduleId : undefined
}
