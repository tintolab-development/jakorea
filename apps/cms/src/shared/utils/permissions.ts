/**
 * 권한 검증 유틸리티 함수
 * Phase 4.1.2: 권한 체계 정의
 */

import type { AdminProgramRole, AdminRole, User, UserRole } from '@/types/user'

/**
 * 사용자가 특정 권한을 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param role 확인할 권한
 * @returns 권한 보유 여부
 */
export function hasRole(user: Omit<User, 'password'> | null, role: UserRole): boolean {
  if (!user) {
    return false
  }
  return user.role === role
}

/**
 * 사용자가 여러 권한 중 하나라도 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param roles 확인할 권한 배열
 * @returns 권한 보유 여부
 */
export function hasAnyRole(
  user: Omit<User, 'password'> | null,
  roles: UserRole[]
): boolean {
  if (!user || roles.length === 0) {
    return false
  }
  return roles.includes(user.role)
}

/**
 * 사용자가 모든 권한을 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param roles 확인할 권한 배열
 * @returns 모든 권한 보유 여부
 */
export function hasAllRoles(
  user: Omit<User, 'password'> | null,
  roles: UserRole[]
): boolean {
  if (!user || roles.length === 0) {
    return false
  }
  return roles.every(role => user.role === role)
}

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 관리자 여부
 */
export function isAdmin(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'ADMIN')
}

export function isMasterAdmin(user: Omit<User, 'password'> | null): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminRole === 'MASTER')
}

export function hasAdminRole(
  user: Omit<User, 'password'> | null,
  adminRole: AdminRole
): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminRole === adminRole)
}

export function hasAdminProgramRole(
  user: Omit<User, 'password'> | null,
  programRole: AdminProgramRole
): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminProgramRole === programRole)
}

/**
 * 사용자가 강사 또는 수강자 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 강사/수강자 여부
 */
export function isInstructorOrStudent(
  user: Omit<User, 'password'> | null
): boolean {
  return hasAnyRole(user, ['INSTRUCTOR', 'STUDENT'])
}

/**
 * 사용자가 수강자 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 수강자 여부
 */
export function isStudent(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'STUDENT')
}

/**
 * 권한 레벨 비교 (관리자 > 강사 > 수강자)
 * @param role1 첫 번째 권한
 * @param role2 두 번째 권한
 * @returns role1이 role2보다 높은 권한이면 true
 */
export function hasHigherRole(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    INSTRUCTOR: 2,
    STUDENT: 1,
    VOLUNTEER: 1,
  }

  return roleHierarchy[role1] > roleHierarchy[role2]
}

/**
 * 권한 레벨 비교 (같거나 높은 권한인지 확인)
 * @param role1 첫 번째 권한
 * @param role2 두 번째 권한
 * @returns role1이 role2보다 같거나 높은 권한이면 true
 */
export function hasEqualOrHigherRole(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    INSTRUCTOR: 2,
    STUDENT: 1,
    VOLUNTEER: 1,
  }

  return roleHierarchy[role1] >= roleHierarchy[role2]
}



