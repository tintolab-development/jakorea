import type { User } from '@/types/user'
import { roleCodeToAdminPermissionVariant } from '@/features/user/shared/lib/admin-permission-display'

export function resolveExplicitAdminPermissionVariant(
  user: Pick<User, 'listMetrics' | 'roleCode' | 'adminLevel'>
): 'manager' | 'partner' | 'viewer' | null {
  const explicit = user.listMetrics?.adminPermissionVariant
  if (explicit === 'manager' || explicit === 'partner' || explicit === 'viewer') return explicit
  const fromRole = roleCodeToAdminPermissionVariant(user.roleCode)
  if (fromRole) return fromRole
  if (user.adminLevel === 'MASTER') return 'manager'
  if (user.adminLevel === 'ADMIN') return 'partner'
  if (user.adminLevel === 'GENERAL') return 'viewer'
  return null
}

export function canShowAdminMfaReset(input: {
  sessionRoleCode?: string | null
  sessionAdminAccountId?: number
  targetRole?: string
  targetAdminAccountId?: number
  targetIsActive?: boolean
  targetPermissionVariant?: 'manager' | 'partner' | 'viewer' | null
}): boolean {
  if (input.sessionRoleCode !== 'MASTER') return false
  if (input.targetRole !== 'ADMIN') return false
  if (input.targetIsActive !== true) return false
  if (typeof input.sessionAdminAccountId !== 'number' || input.sessionAdminAccountId <= 0) {
    return false
  }
  if (typeof input.targetAdminAccountId !== 'number' || input.targetAdminAccountId <= 0) {
    return false
  }
  if (input.sessionAdminAccountId === input.targetAdminAccountId) return false
  return input.targetPermissionVariant === 'partner' || input.targetPermissionVariant === 'viewer'
}
