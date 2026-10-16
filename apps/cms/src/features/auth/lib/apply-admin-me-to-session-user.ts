import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import {
  parseAdminRoleCode,
  withSessionAdminRole,
} from '@/shared/lib/admin-role-policy'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { User } from '@/types/user'

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

/**
 * `/api/admin/me` 날짜 정본을 세션에 반영하기 위한 정규화기.
 * 숫자 timestamp나 비표준 문자열을 추정하지 않고 null로 처리한다.
 */
export function normalizeAdminDate(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.length === 0 || !ISO_DATE_TIME_PATTERN.test(value)) {
    return null
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const daysInMonth = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0
  if (day < 1 || day > daysInMonth) return null

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : value
}

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
    createdAt: normalizeAdminDate(me.createdAt),
    updatedAt: normalizeAdminDate(me.updatedAt),
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
