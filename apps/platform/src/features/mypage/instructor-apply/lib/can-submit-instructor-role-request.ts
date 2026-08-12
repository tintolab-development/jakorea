import type { InstructorRoleRequestSummary } from '../api/types'

/** current 신청 상태 기준으로 신규/재신청 가능 여부 */
export function canSubmitInstructorRoleRequest(
  summary?: InstructorRoleRequestSummary | null,
): boolean {
  if (!summary) return true
  if (summary.canRequest === true) return true
  if (summary.canReapply === true) return true
  if (summary.canRequest === false) return false

  const status = summary.status?.trim().toUpperCase()
  if (!status) return true
  if (status === 'REJECTED' || status === 'REVOKED' || status === 'CANCELLED') return true
  return false
}

export function getInstructorRoleRequestStatusMessage(
  summary?: InstructorRoleRequestSummary | null,
): string {
  const status = summary?.status?.trim().toUpperCase()
  if (status === 'APPROVED' || status === 'COMPLETED') {
    return '이미 강사 권한이 승인되었습니다.'
  }
  if (status === 'PENDING' || status === 'SUBMITTED' || status === 'IN_REVIEW') {
    return '이미 강사 신청이 접수되어 검토 중입니다.'
  }
  if (status === 'REJECTED' && summary?.rejectedReason?.trim()) {
    return `이전 신청이 반려되었습니다. (${summary.rejectedReason.trim()})`
  }
  return '현재 강사 신청을 제출할 수 없습니다.'
}
