import type { GeminiInstructorApplicationApprovalStatus } from '../../model/approved/instructor-application-types'

export type GeminiInstructorApprovalAction = 'approve' | 'change' | 'invalid'

/**
 * 승인 상세의 현재 배정 여부는 목록 필터와 무관하게 상세 API가 확정한 값을 사용한다.
 * 실제 단일 승자 정리와 기존 강사 귀책 처리는 승인 API가 원자적으로 수행한다.
 */
export function resolveGeminiInstructorApprovalAction({
  approvalStatus,
  instructorAssigned,
}: {
  approvalStatus: GeminiInstructorApplicationApprovalStatus
  instructorAssigned: boolean
}): GeminiInstructorApprovalAction {
  if (approvalStatus === 'APPROVED') return 'invalid'
  if (instructorAssigned && (approvalStatus === 'PENDING' || approvalStatus === 'REJECTED')) {
    return 'change'
  }
  return approvalStatus === 'PENDING' ? 'approve' : 'invalid'
}
