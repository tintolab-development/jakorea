import type { GeminiInstructorApplicationRow } from './instructor-application-types'

/** 프로그램에 강사 1명 배정: 선택 강사만 승인 완료, 나머지는 신청 반려 */
export function applyGeminiInstructorAssignment(
  rows: GeminiInstructorApplicationRow[],
  assigneeId: string
): GeminiInstructorApplicationRow[] {
  return rows.map(row => ({
    ...row,
    approvalStatus: row.id === assigneeId ? 'APPROVED' : 'REJECTED',
  }))
}

/** 강사 변경 시작: 모든 신청 강사를 승인 대기로 초기화 */
export function resetGeminiInstructorAssignmentToPending(
  rows: GeminiInstructorApplicationRow[]
): GeminiInstructorApplicationRow[] {
  return rows.map(row => ({
    ...row,
    approvalStatus: 'PENDING',
  }))
}
