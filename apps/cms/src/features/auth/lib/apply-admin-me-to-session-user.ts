import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import {
  parseAdminRoleCode,
  withSessionAdminRole,
} from '@/shared/lib/admin-role-policy'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { User } from '@/types/user'

export function applyAdminMeToSessionUser(
  current: Omit<User, 'password'>,
  me: AdminMeResponse
): Omit<User, 'password'> {
  const roleCode = parseAdminRoleCode(me.roleCode)
  const permissionVariant =
    roleCodeToAdminPermissionVariant(roleCode ?? me.roleCode) ??
    current.listMetrics?.adminPermissionVariant
  const gender = toApiGender(me.gender) ?? current.gender
  const birthDate = toApiBirthDate(me.birthDate) ?? current.birthDate

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
    ...(gender ? { gender } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(roleCode ? { roleCode } : {}),
    ...(permissionVariant
      ? {
          listMetrics: {
            ...current.listMetrics,
            adminPermissionVariant: permissionVariant,
          },
        }
      : {}),
  }
  return withSessionAdminRole(next)
}
