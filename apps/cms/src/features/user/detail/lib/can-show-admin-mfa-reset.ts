import type { User } from '@/types/user'
import {
  isAdminPermissionTagVariant,
  roleCodeToAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'

export function resolveExplicitAdminPermissionVariant(
  user: Pick<User, 'listMetrics' | 'roleCode' | 'adminLevel'>
): AdminPermissionTagVariant | null {
  const explicit = user.listMetrics?.adminPermissionVariant
  if (isAdminPermissionTagVariant(explicit)) return explicit
  const fromRole = roleCodeToAdminPermissionVariant(user.roleCode)
  if (fromRole) return fromRole
  if (user.adminLevel === 'MASTER') return 'manager'
  if (user.adminLevel === 'ADMIN') return 'partner'
  if (user.adminLevel === 'GENERAL') return 'viewer'
  return null
}

function isMasterSession(input: {
  sessionRoleCode?: string | null
  sessionAdminLevel?: string | null
}): boolean {
  const role = (input.sessionRoleCode ?? '').trim().toUpperCase()
  const level = (input.sessionAdminLevel ?? '').trim().toUpperCase()
  return role === 'MASTER' || level === 'MASTER'
}

/** `/me.adminAccountId`와 상세 `adminAccountId` 숫자 비교. */
export function toPositiveAdminAccountId(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** MASTER 세션 + 활성 ADMIN 대상. 본인 상세도 포함(실행자 TOTP step-up 유지). */
export function canShowAdminMfaReset(input: {
  sessionRoleCode?: string | null
  sessionAdminLevel?: string | null
  sessionAdminAccountId?: number | string | null
  targetRole?: string
  targetAdminAccountId?: number | string | null
  targetIsActive?: boolean
  targetPermissionVariant?: AdminPermissionTagVariant | null
  targetRoleCode?: string | null
  targetAdminLevel?: string | null
}): boolean {
  if (!isMasterSession(input)) return false
  if (input.targetRole !== 'ADMIN') return false
  if (input.targetIsActive !== true) return false
  const sessionId = toPositiveAdminAccountId(input.sessionAdminAccountId)
  const targetId = toPositiveAdminAccountId(input.targetAdminAccountId)
  if (sessionId == null || targetId == null) return false
  return true
}
