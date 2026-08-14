import type { InstructorMemberProfile, UserRole } from '@/types/user'

const ROLE_PRIORITY: UserRole[] = ['ADMIN', 'INSTRUCTOR', 'SCHOOL', 'INDIVIDUAL']

function normalizeRoleToken(raw: string): UserRole | undefined {
  const upper = raw.trim().toUpperCase().replace(/-/g, '_')
  /** 강사 memberType·activityType — UserRole·목록 필터에 사용하지 않음 */
  if (upper === 'SCHOOL_TEACHER') return undefined
  if (upper === 'SCHOOL' || upper === 'INSTITUTION' || upper === 'INSTITUTIONS') return 'SCHOOL'
  if (upper === 'INDIVIDUAL' || upper === 'MEMBER') return 'INDIVIDUAL'
  if (upper === 'INSTRUCTOR' || upper === 'INSTRUCTOR_REVOKED') return 'INSTRUCTOR'
  if (upper === 'ADMIN') return 'ADMIN'
  return undefined
}

/** URL·레거시 단일 `role` 쿼리 → UserRole (SCHOOL_TEACHER·INSTRUCTOR_REVOKED 등 비 UserRole 토큰 제외) */
export function parseLegacyRoleFilterParam(raw?: string): UserRole | undefined {
  if (!raw?.trim() || raw.trim().toUpperCase() === 'ALL') return undefined
  const upper = raw.trim().toUpperCase().replace(/-/g, '_')
  if (upper === 'INSTRUCTOR_REVOKED') return undefined
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
  // 교사 전용 토큰만 있으면 CMS UserRole은 INSTRUCTOR (+ instructorMemberProfile school_teacher)
  if (memberRolesIncludeSchoolTeacher(roles)) return 'INSTRUCTOR'
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

/** 서버 `roles[]`를 User에 보존 */
export function copyMemberRoles(roles: string[] | undefined): string[] | undefined {
  if (!Array.isArray(roles) || roles.length === 0) return undefined
  const copied = roles.map(r => String(r).trim()).filter(Boolean)
  return copied.length > 0 ? copied : undefined
}

/** 강사 권한 박탈 스냅샷 — `INSTRUCTOR` → `INSTRUCTOR_REVOKED` (이미 박탈 토큰이면 유지) */
export function memberRolesWithInstructorRevoked(
  roles: string[] | undefined
): string[] | undefined {
  const mapped = (roles ?? []).map(r => {
    const trimmed = String(r).trim()
    if (!trimmed) return trimmed
    const upper = trimmed.toUpperCase().replace(/-/g, '_')
    return upper === 'INSTRUCTOR' ? 'INSTRUCTOR_REVOKED' : trimmed
  })
  return copyMemberRoles(mapped)
}

/**
 * 서버 `roles[]` SSOT (학교/기관 `SCHOOL` 제외)
 * - `SCHOOL_TEACHER` 단독 → 교사 (겸직 아님)
 * - `SCHOOL_TEACHER` + `INSTRUCTOR`/`INSTRUCTOR_REVOKED` → 교사 겸 강사
 * - `INSTRUCTOR`/`INSTRUCTOR_REVOKED` 단독 → 순수 강사
 */
export function inferInstructorMemberProfileFromRoles(
  roles: string[] | undefined
): InstructorMemberProfile | undefined {
  if (!roles?.length) return undefined
  if (memberRolesIncludeSchool(roles)) return undefined
  const hasSchoolTeacher = memberRolesIncludeSchoolTeacher(roles)
  const hasInstructor = roles.some(r => normalizeRoleToken(r) === 'INSTRUCTOR')
  if (hasSchoolTeacher && hasInstructor) return 'instructor_dual'
  if (hasSchoolTeacher) return 'school_teacher'
  if (hasInstructor) return 'instructor_only'
  return undefined
}

/** 상세 GET·레이아웃 힌트 — `roles[]`가 있으면 API `instructorMemberProfile`보다 우선 */
export function resolveInstructorMemberProfileHint(input: {
  roles?: string[]
  instructorMemberProfile?: InstructorMemberProfile
}): InstructorMemberProfile | undefined {
  return inferInstructorMemberProfileFromRoles(input.roles) ?? input.instructorMemberProfile
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
