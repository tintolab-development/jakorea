import type { InstructorMemberProfile, UserRole } from '@/types/user'

const ROLE_PRIORITY: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'SCHOOL', 'INDIVIDUAL']

function normalizeRoleToken(raw: string): UserRole | undefined {
  const upper = raw.trim().toUpperCase()
  /** 강사 memberType·activityType — UserRole·목록 필터에 사용하지 않음 */
  if (upper === 'SCHOOL_TEACHER') return undefined
  if (upper === 'SCHOOL' || upper === 'INSTITUTION' || upper === 'INSTITUTIONS') return 'SCHOOL'
  if (upper === 'INDIVIDUAL' || upper === 'MEMBER') return 'INDIVIDUAL'
  if (upper === 'INSTRUCTOR') return 'INSTRUCTOR'
  if (upper === 'ADMIN') return 'ADMIN'
  return undefined
}

/** URL·레거시 단일 `role` 쿼리 → UserRole (SCHOOL_TEACHER 등 비 UserRole 토큰 제외) */
export function parseLegacyRoleFilterParam(raw?: string): UserRole | undefined {
  if (!raw?.trim() || raw.trim().toUpperCase() === 'ALL') return undefined
  return normalizeRoleToken(raw)
}

/** 목록·상세 회원 유형 — `roles` 배열만 사용 */
export function resolvePrimaryUserRoleFromRoles(roles: string[] | undefined): UserRole {
  const normalized = (roles ?? [])
    .map(t => normalizeRoleToken(t))
    .filter((r): r is UserRole => r != null)
  for (const priority of ROLE_PRIORITY) {
    if (normalized.includes(priority)) return priority
  }
  return 'INDIVIDUAL'
}

/** 학교(교사) 회원 목록 — `roles`에 SCHOOL 포함 여부 */
export function memberRolesIncludeSchool(roles: string[] | undefined): boolean {
  return (roles ?? []).some(r => normalizeRoleToken(r) === 'SCHOOL')
}

/** 교사 회원 유형 토큰 — UserRole SCHOOL(기관)과 구분 */
export function memberRolesIncludeSchoolTeacher(roles: string[] | undefined): boolean {
  return (roles ?? []).some(r => r.trim().toUpperCase().replace(/-/g, '_') === 'SCHOOL_TEACHER')
}

/** 전체 회원 목록 표시용 — `SCHOOL_TEACHER`(+ INSTRUCTOR) → instructorMemberProfile */
export function inferInstructorMemberProfileFromRoles(
  roles: string[] | undefined
): InstructorMemberProfile | undefined {
  if (!memberRolesIncludeSchoolTeacher(roles)) return undefined
  const hasInstructor = (roles ?? []).some(r => normalizeRoleToken(r) === 'INSTRUCTOR')
  return hasInstructor ? 'instructor_dual' : 'school_teacher'
}

export function resolvePrimaryUserRole(
  roles: string[] | undefined,
  fallbackRole?: string
): UserRole {
  if (fallbackRole?.trim()) {
    return resolvePrimaryUserRoleFromRoles([...(roles ?? []), fallbackRole])
  }
  return resolvePrimaryUserRoleFromRoles(roles)
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
