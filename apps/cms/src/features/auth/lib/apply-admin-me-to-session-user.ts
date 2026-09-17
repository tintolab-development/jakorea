import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import {
  parseAdminRoleCode,
  withSessionAdminRole,
} from '@/shared/lib/admin-role-policy'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { User } from '@/types/user'

function mapAdminMeTerms(me: AdminMeResponse): User['termsAgreements'] {
  if (!me.termsAgreements?.length) return undefined
  return me.termsAgreements.map(row => ({
    termsType: row.termsType?.trim() || row.consentType?.trim() || undefined,
    termsVersion: row.version?.trim() || undefined,
    required: row.required,
    agreed: row.agreed,
    agreedAt: row.agreedAt,
    sourceFlow: row.sourceFlow,
  }))
}

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
  const termsAgreements = mapAdminMeTerms(me) ?? current.termsAgreements
  const hasManagedProgramMetrics =
    me.activeManagedProgramCount != null || me.totalManagedProgramCount != null

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
    ...(termsAgreements ? { termsAgreements } : {}),
    ...(gender ? { gender } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(roleCode ? { roleCode } : {}),
    ...(permissionVariant || hasManagedProgramMetrics
      ? {
          listMetrics: {
            ...current.listMetrics,
            ...(permissionVariant ? { adminPermissionVariant: permissionVariant } : {}),
            ...(me.activeManagedProgramCount != null
              ? { managedProgramInProgressCount: me.activeManagedProgramCount }
              : {}),
            ...(me.totalManagedProgramCount != null
              ? { managedProgramCount: me.totalManagedProgramCount }
              : {}),
          },
        }
      : {}),
  }
  return withSessionAdminRole(next)
}
