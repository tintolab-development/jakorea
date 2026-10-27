import type { User } from '@/types/user'

export type AdminPermissionTagVariant = 'manager' | 'partner' | 'viewer'

/**
 * 관리자 권한 유형 표시명.
 * 관리자 권한 설정 탭 라벨과 맞춘다.
 * Accounting Manager는 승인 셀렉트에만 노출하고, 선택은 아직 준비 중이다.
 */
export const ADMIN_PERMISSION_TAG_LABEL: Record<AdminPermissionTagVariant, string> = {
  manager: 'Master',
  partner: 'Program Manager',
  viewer: 'Program Viewer',
}

/** 승인 셀렉트 전용. 아직 API roleCode가 없어 선택 시 준비 중 안내만 한다. */
export const ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE = 'accounting-manager'

export const ADMIN_PERMISSION_SELECT_OPTIONS: {
  value: string
  label: string
}[] = [
  { value: 'manager', label: ADMIN_PERMISSION_TAG_LABEL.manager },
  { value: ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE, label: 'Accounting Manager' },
  { value: 'partner', label: ADMIN_PERMISSION_TAG_LABEL.partner },
  { value: 'viewer', label: ADMIN_PERMISSION_TAG_LABEL.viewer },
]

export function isAdminPermissionSelectComingSoon(value: string | undefined): boolean {
  return value === ADMIN_PERMISSION_ACCOUNTING_MANAGER_SELECT_VALUE
}

/**
 * API roleCode / listMetrics 문자열 → UI variant
 * OpenAPI MASTER·MIDDLE·VIEWER + 레거시 PM·PARTNER 및 FE variant(manager/partner/viewer) 수용
 */
export function roleCodeToAdminPermissionVariant(
  roleCode?: string
): AdminPermissionTagVariant | null {
  const raw = (roleCode ?? '').trim()
  if (!raw) return null
  const upper = raw.toUpperCase()
  if (upper === 'MASTER' || raw === 'manager') return 'manager'
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
  if (explicit === 'manager' || explicit === 'partner' || explicit === 'viewer') {
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
