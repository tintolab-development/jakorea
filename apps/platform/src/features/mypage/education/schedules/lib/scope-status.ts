import type { PortalEducationScheduleScopeStatus } from '../../applications/api/activity-client'
import type { EducationScheduleItem } from '../model/types'

function hasAssignedScheduleId(item: Pick<EducationScheduleItem, 'scheduleId'>): boolean {
  return item.scheduleId != null && Number.isSafeInteger(item.scheduleId) && item.scheduleId > 0
}

/**
 * 마이페이지 교육일정 — 본인에게 배정된 운영 일정만.
 * 커리큘럼 정의 행(scheduleId 없음)은 숨긴다.
 */
export function isMemberAssignedEducationScheduleItem(
  item: Pick<EducationScheduleItem, 'scheduleId'>,
): boolean {
  return hasAssignedScheduleId(item)
}

export function filterEducationSchedulesForMemberAssignment<
  T extends Pick<EducationScheduleItem, 'scheduleId'>,
>(items: readonly T[]): T[] {
  return items.filter(item => isMemberAssignedEducationScheduleItem(item))
}

export function resolveEducationScheduleEmptyMessage(
  scopeStatus: PortalEducationScheduleScopeStatus | null | undefined,
  listTitle: string,
): string {
  const isAssignmentList = listTitle === '배정 현황' || listTitle === '배정현황'
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
