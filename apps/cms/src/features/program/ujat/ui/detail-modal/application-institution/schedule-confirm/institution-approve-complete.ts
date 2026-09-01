export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE = '기관 승인 완료'

export function getUjatInstitutionScheduleConfirmApproveCompleteContent(
  institutionName: string,
  assignedInstructorCount: number
): string {
  const name = institutionName.trim() || '기관'
  return `[${name}]의 프로그램 참여가 승인 되었습니다.\n(현재 배정 강사 : ${assignedInstructorCount}명)`
}

/** mock — 강사 배정 연동 전 0명 고정 */
export function getUjatInstitutionScheduleConfirmAssignedInstructorCount(
  _institutionId: string
): number {
  return 0
}
