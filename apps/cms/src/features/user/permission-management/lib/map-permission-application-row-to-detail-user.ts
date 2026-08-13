/**
 * 권한 승인 목록 행 → 상세 모달용 User 스텁.
 * 강사: remote일 때 `GET …/instructor-role-requests/{requestId}`로 교체.
 * 관리자·fallback: 목록 필드만 사용.
 */

import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'
import type { User } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'

export function mapPermissionApplicationRowToDetailUser(
  row: MemberPermissionApplicationRow,
  permissionRole: 'instructor' | 'admin'
): Omit<User, 'password'> {
  if (row.memberId != null) {
    registerMemberIdMapping(row.userId, row.memberId)
  }

  const role: User['role'] = permissionRole === 'admin' ? 'ADMIN' : 'INSTRUCTOR'

  const appliedAt = row.appliedAt || new Date().toISOString()

  return {
    id: row.userId,
    memberId: row.memberId,
    adminAccountId: row.adminId,
    instructorRoleRequestId: permissionRole === 'instructor' ? row.requestId : undefined,
    name: row.name?.trim() || '-',
    phone: row.phone ?? '',
    email: row.email ?? '',
    role,
    isActive: true,
    permissionApprovalStatus: row.approvalStatus,
    listMetrics: {
      permissionApplicationTypeLabel: row.applicationTypeLabel,
    },
    instructorMemberProfile: permissionRole === 'instructor' ? 'instructor_only' : undefined,
    createdAt: appliedAt,
    updatedAt: appliedAt,
  }
}
