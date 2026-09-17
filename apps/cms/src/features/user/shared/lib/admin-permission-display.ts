import type { User } from '@/types/user'

export type AdminPermissionTagVariant = 'manager' | 'partner' | 'viewer'

export const ADMIN_PERMISSION_TAG_LABEL: Record<AdminPermissionTagVariant, string> = {
  manager: '마스터 관리자',
  partner: '중간 관리자',
  viewer: '뷰어',
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
