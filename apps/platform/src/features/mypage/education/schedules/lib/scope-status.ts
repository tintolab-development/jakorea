import type { PortalEducationScheduleScopeStatus } from '../../applications/api/activity-client'

export function resolveEducationScheduleEmptyMessage(
  scopeStatus: PortalEducationScheduleScopeStatus | null | undefined,
  listTitle: string,
): string {
  const isAssignmentList = listTitle === '배정현황'
  const defaultMessage = isAssignmentList
    ? '등록된 배정 일정이 없어요'
    : '등록된 교육일정이 없어요'

  switch (scopeStatus) {
    case 'NO_SCOPE_EVIDENCE':
      return isAssignmentList
        ? '확정된 배정 일정이 아직 없어요'
        : '확정된 교육 일정이 아직 없어요'
    case 'PROGRAM_SCHEDULE':
      return isAssignmentList ? defaultMessage : '아직 참여 전이라 표시할 교육 일정이 없어요'
    case 'RECORDED_ONLY':
    case 'ASSIGNMENT_SCOPED':
    default:
      return defaultMessage
  }
}
