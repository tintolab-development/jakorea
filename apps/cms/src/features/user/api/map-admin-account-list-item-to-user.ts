import type { AdminAccountListItemResponse } from '@/shared/api/generated/members/schemas'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import { mapMemberStatusToIsActive } from '@/features/user/api/map-member-role'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import type { User } from '@/types/user'

export function mapAdminAccountListItemToUser(
  item: AdminAccountListItemResponse
): Omit<User, 'password'> {
  const adminAccountId = item.adminAccountId
  const uuid = item.uuid?.trim()
  const id =
    uuid ??
    (adminAccountId != null ? `admin-account-${adminAccountId}` : `admin-account-unknown-${crypto.randomUUID()}`)
  const now = new Date().toISOString()
  const permissionVariant = roleCodeToAdminPermissionVariant(item.roleCode)
  const role = 'ADMIN' as const

  return {
    id,
    adminAccountId,
    email: String(item.email ?? '').trim() || '-',
    name: String(item.name ?? '').trim() || '-',
    phone: item.phone?.trim() || undefined,
    role,
    isActive: mapMemberStatusToIsActive(undefined, item.status),
    createdAt: item.createdAt ?? now,
    updatedAt: item.createdAt ?? now,
    lastLoginAt: item.lastLoginAt ?? undefined,
    registeredByAdmin: resolveRegisteredByAdmin({ role, adminAccountId }),
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({ role, adminAccountId }),
    listMetrics: permissionVariant ? { adminPermissionVariant: permissionVariant } : undefined,
  }
}

export function mapAdminAccountListItems(
  items: AdminAccountListItemResponse[] | undefined
): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.map(mapAdminAccountListItemToUser)
}
