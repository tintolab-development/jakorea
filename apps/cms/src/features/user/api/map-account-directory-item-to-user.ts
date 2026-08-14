import type { AccountDirectoryItemResponse } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponse'
import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  copyMemberRoles,
  inferInstructorMemberProfileFromRoles,
  mapMemberStatusToIsActive,
  resolvePrimaryUserRoleFromRoles,
} from '@/features/user/api/map-member-role'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
} from '@/features/user/api/resolve-member-registration-flags'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'
import type { User } from '@/types/user'

function resolveDirectoryAdminAccountId(item: AccountDirectoryItemResponse): number | undefined {
  return (
    coercePositiveInt(item.adminAccountId) ??
    (item.accountType === AccountDirectoryItemResponseAccountType.ADMIN_ACCOUNT
      ? coercePositiveInt(item.accountId)
      : undefined)
  )
}

function resolveDirectoryMemberId(item: AccountDirectoryItemResponse): number | undefined {
  return (
    coercePositiveInt(item.memberId) ??
    (item.accountType === AccountDirectoryItemResponseAccountType.MEMBER
      ? coercePositiveInt(item.accountId)
      : undefined)
  )
}

/** `GET /api/admin/members/all` 행 → 목록 User */
export function mapAccountDirectoryItemToUser(
  item: AccountDirectoryItemResponse
): Omit<User, 'password'> {
  const isAdmin = item.accountType === AccountDirectoryItemResponseAccountType.ADMIN_ACCOUNT
  const adminAccountId = resolveDirectoryAdminAccountId(item)
  const memberId = isAdmin ? undefined : resolveDirectoryMemberId(item)
  const uuid =
    item.uuid?.trim() ||
    (adminAccountId != null
      ? `admin-account-${adminAccountId}`
      : memberId != null
        ? `member-${memberId}`
        : `account-unknown-${crypto.randomUUID()}`)

  if (memberId != null) {
    registerMemberIdMapping(uuid, memberId)
  }

  const now = new Date().toISOString()

  if (isAdmin) {
    const role = 'ADMIN' as const
    const roleCode = item.roles?.find(r => r.trim())?.trim()
    const permissionVariant = roleCodeToAdminPermissionVariant(roleCode)
    return {
      id: uuid,
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

  const role = resolvePrimaryUserRoleFromRoles(item.roles)
  const instructorMemberProfile = inferInstructorMemberProfileFromRoles(item.roles)
  const resolvedRole =
    role === 'INDIVIDUAL' && instructorMemberProfile != null ? 'INSTRUCTOR' : role
  const roles = copyMemberRoles(item.roles)
  return {
    id: uuid,
    memberId,
    email: String(item.email ?? '').trim() || '-',
    name: String(item.name ?? '').trim() || '-',
    phone: item.phone?.trim() || undefined,
    role: resolvedRole,
    ...(roles ? { roles } : {}),
    isActive: mapMemberStatusToIsActive(undefined, item.status),
    createdAt: item.createdAt ?? now,
    updatedAt: item.createdAt ?? now,
    lastLoginAt: item.lastLoginAt ?? undefined,
    registeredByAdmin: resolveRegisteredByAdmin({ role: resolvedRole }),
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration({ role: resolvedRole }),
    ...(instructorMemberProfile ? { instructorMemberProfile } : {}),
  }
}

export function mapAccountDirectoryItems(
  items: AccountDirectoryItemResponse[] | undefined
): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.map(mapAccountDirectoryItemToUser)
}
