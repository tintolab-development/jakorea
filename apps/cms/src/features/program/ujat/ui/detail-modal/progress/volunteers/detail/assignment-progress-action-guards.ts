import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'

export const ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT = {
  title: '배정 취소 불가 안내',
  content:
    '이미 진행 완료된 일정입니다.\n배정 취소는 진행 예정인 교육 일정만 가능합니다.',
} as const

export function buildAssignmentCancelBulkCompletedAlert(selectedCount: number) {
  return {
    title: '배정 취소 불가 안내',
    content: `선택한 ${selectedCount}개의 항목 중 진행 완료된 일정이 있습니다.\n배정 취소는 진행 예정인 교육 일정만 가능합니다.`,
  } as const
}

export const ATTENDANCE_CORRECTION_NOT_ALLOWED_SCHEDULED_ALERT = {
  title: '출결 정정 불가 안내',
  content:
    '아직 진행 예정인 일정입니다.\n출결 정정은 진행 완료된 교육만 가능합니다.',
} as const

export const ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT = {
  title: '출결 정정 불가 안내',
  content:
    '출결 정정은 한 건씩 가능합니다.\n출결을 정정할 일정을 하나만 선택해 주세요',
} as const

export const ASSIGNMENT_SELECT_ONE_ALERT = {
  title: '안내',
  content: '교육 일정을 1개 선택해 주세요.',
} as const

export function isAssignmentCancelableByProgress(
  row: Pick<UjatVolunteerAssignmentProgressRow, 'educationProgress'>
): boolean {
  return row.educationProgress === 'scheduled'
}

export function isAttendanceCorrectableByProgress(
  row: Pick<UjatVolunteerAssignmentProgressRow, 'educationProgress'>
): boolean {
  return row.educationProgress === 'completed'
}

export function resolveSelectedAssignmentRows(
  rows: readonly UjatVolunteerAssignmentProgressRow[],
  selectedRowKeys: readonly unknown[]
): UjatVolunteerAssignmentProgressRow[] {
  const keySet = new Set(selectedRowKeys.map(key => String(key)))
  return rows.filter(row => keySet.has(row.id))
}
