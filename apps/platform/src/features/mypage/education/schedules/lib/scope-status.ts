import type { PortalEducationScheduleScopeStatus } from '../../applications/api/activity-client'
import type { EducationScheduleItem } from '../model/types'

function hasAssignedScheduleId(item: Pick<EducationScheduleItem, 'scheduleId'>): boolean {
  return item.scheduleId != null && Number.isSafeInteger(item.scheduleId) && item.scheduleId > 0
}

/**
 * ASSIGNMENT_SCOPED / RECORDED_ONLY: CMS가 확정한 본인 배정만.
 * items에 커리큘럼 정의 행(scheduleId 없음)이 같이 와도 숨긴다.
 * PROGRAM_SCHEDULE 등 미리보기는 기존처럼 전체 행을 둔다.
 */
export function isMemberAssignedEducationScheduleItem(
  item: Pick<EducationScheduleItem, 'scheduleId'>,
  scopeStatus: PortalEducationScheduleScopeStatus | null | undefined,
): boolean {
  switch ((scopeStatus ?? '').trim().toUpperCase()) {
    case 'ASSIGNMENT_SCOPED':
    case 'RECORDED_ONLY':
      return hasAssignedScheduleId(item)
    default:
      return true
  }
}

export function filterEducationSchedulesForMemberAssignment<
  T extends Pick<EducationScheduleItem, 'scheduleId'>,
>(
  items: readonly T[],
  scopeStatus: PortalEducationScheduleScopeStatus | null | undefined,
): T[] {
  return items.filter(item => isMemberAssignedEducationScheduleItem(item, scopeStatus))
}

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
