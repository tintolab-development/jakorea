import type { AdminAccountListItemResponse } from '@/shared/api/generated/members/schemas'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import { mapMemberStatusToIsActive } from '@/features/user/api/map-member-role'
import {
  resolveIdentitySelfSignupCompletedAfterAdminRegistration,
  resolveRegisteredByAdmin,
  type MemberRegistrationFlagSource,
} from '@/features/user/api/resolve-member-registration-flags'
import type { User, UserListRowMetrics } from '@/types/user'

function buildAdminAccountListMetrics(item: {
  roleCode?: string
  managedProgramCount?: number
  hasProgramAssignmentHistory?: boolean
}): UserListRowMetrics | undefined {
  const metrics: UserListRowMetrics = {}
  const permissionVariant = roleCodeToAdminPermissionVariant(item.roleCode)
  if (permissionVariant) {
    metrics.adminPermissionVariant = permissionVariant
  }
  if (item.managedProgramCount != null && !Number.isNaN(item.managedProgramCount)) {
    metrics.managedProgramCount = item.managedProgramCount
  }
  if (typeof item.hasProgramAssignmentHistory === 'boolean') {
    metrics.hasProgramAssignmentHistory = item.hasProgramAssignmentHistory
  }
  return Object.keys(metrics).length > 0 ? metrics : undefined
}

function buildAdminListRegistrationFlagSource(
  item: AdminAccountListItemResponse,
  adminAccountId?: number
): MemberRegistrationFlagSource {
  return {
    role: 'ADMIN',
    adminAccountId,
    registeredByAdmin: item.registeredByAdmin,
    createdByAdmin: item.createdByAdmin,
    identityVerified: item.identityVerified,
  }
}

export function mapAdminAccountListItemToUser(
  item: AdminAccountListItemResponse
): Omit<User, 'password'> {
  const adminAccountId = item.adminAccountId
  const uuid = item.uuid?.trim()
  const id =
    uuid ??
    (adminAccountId != null ? `admin-account-${adminAccountId}` : `admin-account-unknown-${crypto.randomUUID()}`)
  const now = new Date().toISOString()
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
    registeredByAdmin: resolveRegisteredByAdmin(
      buildAdminListRegistrationFlagSource(item, adminAccountId)
    ),
    identitySelfSignupCompletedAfterAdminRegistration:
      resolveIdentitySelfSignupCompletedAfterAdminRegistration(
        buildAdminListRegistrationFlagSource(item, adminAccountId)
      ),
    listMetrics: buildAdminAccountListMetrics(item),
  }
}

export function mapAdminAccountListItems(
  items: AdminAccountListItemResponse[] | undefined
): Omit<User, 'password'>[] {
  if (!items?.length) return []
  return items.map(mapAdminAccountListItemToUser)
}
