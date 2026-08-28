import {
  ADMIN_PERMISSION_TAG_LABEL,
} from '@/features/user/shared/lib/admin-permission-display'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import {
  mapAdminAccountStatusToApplicationStatus,
} from '@/features/user/api/lib/map-permission-approval-status'
import type { AdminAccountListItemResponse } from '@/shared/api/generated/members/schemas'
import type {
  MemberPermissionApplicationRow,
} from '@/types/member-permission-application'

function applicationTypeLabelForAdminAccount(item: AdminAccountListItemResponse): string {
  const roleName = item.roleName?.trim()
  if (roleName) return roleName

  const variant = roleCodeToAdminPermissionVariant(item.roleCode)
  if (variant) return ADMIN_PERMISSION_TAG_LABEL[variant]

  const status = mapAdminAccountStatusToApplicationStatus(item.status)
  if (status === 'PENDING') return '관리자 권한 신청'

  return item.roleCode?.trim() || '-'
}

export function mapAdminApprovalRequestToRow(
  item: AdminAccountListItemResponse
): MemberPermissionApplicationRow {
  const adminId = item.adminAccountId
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
    approvalStatus: mapAdminAccountStatusToApplicationStatus(item.status),
    appliedAt: item.createdAt ?? new Date().toISOString(),
  }
}
