import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'
import type { User } from '@/types/user'

/** 관리자 계정 status → 권한 승인 목록/상세 배지 */
export function mapAdminAccountStatusToApplicationStatus(
  status?: string
): MemberPermissionApplicationStatus {
  const upper = (status ?? '').trim().toUpperCase()
  if (upper === 'PENDING_VERIFICATION' || upper === 'PENDING') return 'PENDING'
  if (upper === 'ACTIVE' || upper === 'APPROVED' || upper === 'VERIFIED') return 'APPROVED'
  if (
    upper === 'REJECTED' ||
    upper === 'REJECTED_VERIFICATION' ||
    upper === 'INACTIVE' ||
    upper === 'SUSPENDED' ||
    upper === 'REVOKED'
  ) {
    return 'REJECTED'
  }
  return 'PENDING'
}

export function mapAdminAccountStatusToUserApprovalStatus(
  status?: string
): User['permissionApprovalStatus'] | undefined {
  const mapped = mapAdminAccountStatusToApplicationStatus(status)
  return mapped
}

/** 강사 role-request list item requestStatus → UI 배지 */
export function mapInstructorRoleRequestStatusToApplicationStatus(
  status?: string
): MemberPermissionApplicationStatus {
  const upper = (status ?? '').trim().toUpperCase()
  if (upper === 'APPROVED' || upper === 'COMPLETED') return 'APPROVED'
  if (upper === 'REJECTED' || upper === 'REVOKED') return 'REJECTED'
  return 'PENDING'
}

/** URL 필터 permI_approval / permA_approval → API status query (강사 목록) */
export function mapUiApprovalFilterToApiStatus(
  approval: MemberPermissionApplicationStatus | 'ALL'
): string | undefined {
  if (approval === 'ALL') return undefined
  return approval
}
