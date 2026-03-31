import type { User } from '@/types/user'

export type AdminPermissionTagVariant = 'manager' | 'partner' | 'viewer'

export const ADMIN_PERMISSION_TAG_LABEL: Record<AdminPermissionTagVariant, string> = {
  manager: '담당자',
  partner: '파트너',
  viewer: '뷰어',
}

type AdminPermissionSource = Pick<User, 'listMetrics' | 'programRoles'>

export function getAdminPermissionVariant(user: AdminPermissionSource): AdminPermissionTagVariant {
  const explicit = user.listMetrics?.adminPermissionVariant
  if (explicit === 'manager' || explicit === 'partner' || explicit === 'viewer') {
    return explicit
  }
  const roles = user.programRoles ? Object.values(user.programRoles) : []
  if (roles.includes('OWNER')) return 'manager'
  if (roles.includes('PARTNER')) return 'partner'
  return 'viewer'
}
