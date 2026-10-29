import type { User } from '@/types/user'

export const ADMIN_PERMISSION_TAG_VARIANTS = [
  'manager',
  'accounting',
  'partner',
  'viewer',
] as const

export type AdminPermissionTagVariant = (typeof ADMIN_PERMISSION_TAG_VARIANTS)[number]

/**
 * 관리자 권한 유형 표시명.
 * 관리자 권한 설정 탭 라벨과 맞춘다.
 */
export const ADMIN_PERMISSION_TAG_LABEL: Record<AdminPermissionTagVariant, string> = {
  manager: 'Master',
  accounting: 'Accounting Manager',
  partner: 'Program Manager',
  viewer: 'Program Viewer',
}

/** 승인 셀렉트 value. Accounting Manager는 `accounting` variant. */
export const ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE = 'accounting' as const

export const ADMIN_PERMISSION_SELECT_OPTIONS: {
  value: AdminPermissionTagVariant
  label: string
}[] = ADMIN_PERMISSION_TAG_VARIANTS.map(value => ({
  value,
  label: ADMIN_PERMISSION_TAG_LABEL[value],
}))

export function isAdminPermissionTagVariant(
  value: string | undefined | null
): value is AdminPermissionTagVariant {
  return (
    value === 'manager' ||
    value === 'accounting' ||
    value === 'partner' ||
    value === 'viewer'
  )
}

export function isAdminPermissionSelectComingSoon(_value: string | undefined): boolean {
  return false
}

/**
 * API roleCode / listMetrics 문자열 → UI variant
 * OpenAPI MASTER·MIDDLE·VIEWER·ACCOUNTING_MANAGER + 레거시 PM·PARTNER 및 FE variant 수용
 */
export function roleCodeToAdminPermissionVariant(
  roleCode?: string
): AdminPermissionTagVariant | null {
  const raw = (roleCode ?? '').trim()
  if (!raw) return null
  const upper = raw.toUpperCase().replace(/-/g, '_')
  if (upper === 'MASTER' || raw === 'manager') return 'manager'
  if (
    upper === 'ACCOUNTING_MANAGER' ||
    upper === 'ACCOUNTING' ||
    raw === 'accounting' ||
    raw === 'accounting-manager'
  ) {
    return 'accounting'
  }
  if (
    upper === 'MIDDLE' ||
    upper === 'PM' ||
    upper === 'PARTNER' ||
    raw === 'partner'
  ) {
    return 'partner'
  }
  if (upper === 'VIEWER' || raw === 'viewer') return 'viewer'
  return null
}

type AdminPermissionSource = Pick<User, 'listMetrics' | 'programRoles' | 'roleCode' | 'adminLevel'>

/**
 * 권한 유형 UI variant.
 * 우선순위: listMetrics.adminPermissionVariant → roleCode(/api/admin/me) → programRoles → adminLevel
 */
export function getAdminPermissionVariant(user: AdminPermissionSource): AdminPermissionTagVariant {
  const explicit = user.listMetrics?.adminPermissionVariant
  if (isAdminPermissionTagVariant(explicit)) {
    return explicit
  }

  const fromRoleCode = roleCodeToAdminPermissionVariant(user.roleCode)
  if (fromRoleCode) return fromRoleCode

  const roles = user.programRoles ? Object.values(user.programRoles) : []
  if (roles.includes('OWNER')) return 'manager'
  if (roles.includes('PARTNER')) return 'partner'

  if (user.adminLevel === 'MASTER') return 'manager'
  if (user.adminLevel === 'ADMIN') return 'partner'
  return 'viewer'
}
