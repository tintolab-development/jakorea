import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import type { AdminAccountListItemResponse } from '@/shared/api/generated/members/schemas'
import type {
  MemberPermissionApplicationRow,
  MemberPermissionApplicationStatus,
} from '@/types/member-permission-application'

function mapAdminAccountStatus(status?: string): MemberPermissionApplicationStatus {
  const upper = (status ?? '').trim().toUpperCase()
  if (upper === 'PENDING_VERIFICATION' || upper === 'PENDING') return 'PENDING'
  if (upper === 'ACTIVE' || upper === 'APPROVED' || upper === 'VERIFIED') return 'APPROVED'
  if (upper === 'REJECTED' || upper === 'INACTIVE' || upper === 'SUSPENDED' || upper === 'REVOKED') {
    return 'REJECTED'
  }
  return 'PENDING'
}

function roleCodeToPermissionVariant(roleCode?: string): AdminPermissionTagVariant | null {
  const upper = (roleCode ?? '').trim().toUpperCase()
  if (upper === 'MASTER') return 'manager'
  if (upper === 'PM' || upper === 'PARTNER') return 'partner'
  if (upper === 'VIEWER') return 'viewer'
  return null
}

function applicationTypeLabelForAdminAccount(item: AdminAccountListItemResponse): string {
  const roleName = item.roleName?.trim()
  if (roleName) return roleName

  const variant = roleCodeToPermissionVariant(item.roleCode)
  if (variant) return ADMIN_PERMISSION_TAG_LABEL[variant]

  const status = mapAdminAccountStatus(item.status)
  if (status === 'PENDING') return '관리자 권한 신청'

  return item.roleCode?.trim() || '-'
}

export function mapAdminApprovalRequestToRow(
  item: AdminAccountListItemResponse
): MemberPermissionApplicationRow {
  const adminId = item.id
  const uuid = item.uuid?.trim()
  const userId = uuid ? `admin-${uuid}` : `admin-account-${adminId ?? 'unknown'}`

  return {
    id: `aa-${adminId ?? uuid ?? crypto.randomUUID()}`,
    requestId: adminId,
    adminId,
    userId,
    name: item.name?.trim() || '-',
    phone: item.phone?.trim() || '',
    email: item.email?.trim() || '',
    memberCategory: 'ADMIN',
    applicationTypeLabel: applicationTypeLabelForAdminAccount(item),
    approvalStatus: mapAdminAccountStatus(item.status),
    appliedAt: item.createdAt ?? new Date().toISOString(),
  }
}
