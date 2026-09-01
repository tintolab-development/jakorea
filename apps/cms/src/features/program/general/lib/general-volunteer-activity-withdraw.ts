import { resolveEmployeeVolunteerSessionRows } from '@/features/program/general/lib/employee-volunteer-session-rows'
import type { ActivityWithdrawScheduleOption } from '@/features/program/shared/lib/activity-withdraw-schedule'
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
