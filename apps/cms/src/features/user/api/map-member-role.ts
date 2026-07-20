import type { UserRole } from '@/types/user'

const ROLE_PRIORITY: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'SCHOOL', 'INDIVIDUAL']

function normalizeRoleToken(raw: string): UserRole | undefined {
  const upper = raw.trim().toUpperCase()
  if (upper === 'SCHOOL' || upper === 'INSTITUTION' || upper === 'INSTITUTIONS') return 'SCHOOL'
  if (upper === 'INDIVIDUAL' || upper === 'MEMBER') return 'INDIVIDUAL'
  if (upper === 'INSTRUCTOR') return 'INSTRUCTOR'
  if (upper === 'ADMIN') return 'ADMIN'
  return undefined
}

export function resolvePrimaryUserRole(
  roles: string[] | undefined,
  fallbackRole?: string
): UserRole {
  const tokens = [...(roles ?? [])]
  if (fallbackRole?.trim()) tokens.push(fallbackRole)
  const normalized = tokens
    .map(t => normalizeRoleToken(t))
    .filter((r): r is UserRole => r != null)
  for (const priority of ROLE_PRIORITY) {
    if (normalized.includes(priority)) return priority
  }
  return 'INDIVIDUAL'
}

export function mapMemberStatusToIsActive(memberStatus?: string, status?: string): boolean {
  const raw = (memberStatus ?? status ?? '').trim().toUpperCase()
  if (!raw) return true
  if (raw === 'ACTIVE' || raw === 'ENABLED' || raw === 'NORMAL') return true
  if (raw === 'INACTIVE' || raw === 'DISABLED' || raw === 'DORMANT' || raw === 'WITHDRAWN') {
    return false
  }
  return true
}

export function mapUserRoleToApiRole(role?: UserRole): string | undefined {
  if (!role) return undefined
  if (role === 'SCHOOL') return 'SCHOOL'
  return role
}

export function mapIsActiveToMemberStatus(isActive?: boolean): string | undefined {
  if (isActive === undefined) return undefined
  return isActive ? 'ACTIVE' : 'INACTIVE'
}
