import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import {
  parseAdminRoleCode,
  withSessionAdminRole,
} from '@/shared/lib/admin-role-policy'
import type { User } from '@/types/user'

export function applyAdminMeToSessionUser(
  current: Omit<User, 'password'>,
  me: AdminMeResponse
): Omit<User, 'password'> {
  const roleCode = parseAdminRoleCode(me.roleCode)
  const next: Omit<User, 'password'> = {
    ...current,
    id: me.uuid?.trim() || current.id,
    adminAccountId: me.adminAccountId ?? current.adminAccountId,
    email: me.email?.trim() || current.email,
    name: me.name?.trim() || current.name,
    phone: me.phone?.trim() || current.phone,
    lastLoginAt: me.lastLoginAt ?? current.lastLoginAt,
    createdAt: me.createdAt ?? current.createdAt,
    updatedAt: me.updatedAt ?? current.updatedAt,
    permissionCodes: me.permissionCodes,
    ...(roleCode ? { roleCode } : {}),
  }
  return withSessionAdminRole(next)
}
