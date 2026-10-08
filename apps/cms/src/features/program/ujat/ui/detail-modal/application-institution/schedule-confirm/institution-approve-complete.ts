export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE = '기관 승인 완료'

/** `assignedInstructorCount`가 null이면 「현재 배정 강사」 줄을 생략한다 */
export function getUjatInstitutionScheduleConfirmApproveCompleteContent(
  institutionName: string,
  assignedInstructorCount: number | null
): string {
  const name = institutionName.trim() || '기관'
  const message = `[${name}]의 프로그램 참여가 승인 되었습니다.`
  if (assignedInstructorCount == null) return message
  return `${message}\n(현재 배정 강사 : ${assignedInstructorCount}명)`
}
