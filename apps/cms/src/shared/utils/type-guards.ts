/**
 * 타입 가드 유틸리티
 * Phase 2: 타입 안전성 개선
 */

import type { User, AdminLevel } from '@/types/user'

/**
 * AdminUser 타입 정의
 */
export interface AdminUser extends Omit<User, 'password'> {
  role: 'ADMIN'
  adminLevel: AdminLevel
  permissions?: Record<string, boolean>
}

/**
 * 사용자가 관리자 사용자인지 확인하는 타입 가드
 * @param user 사용자 객체
 * @returns user가 AdminUser인지 여부
 */
export function isAdminUser(user: User | Omit<User, 'password'> | null): user is AdminUser {
  if (!user) return false
  return user.role === 'ADMIN' && 'adminLevel' in user && user.adminLevel !== undefined
}

/**
 * 관리자 권한 타입 정의
 */
export type AdminPermissions = {
  canManageUsers?: boolean
  canManageSystemSettings?: boolean
  canAccessAllPrograms?: boolean
  canDeleteUsers?: boolean
  canApprovePermissionRequests?: boolean
  canCreateProgram?: boolean
  canEditProgram?: boolean
  canDeleteProgram?: boolean
  canDownloadData?: boolean
  canManageSettlements?: boolean
}

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 * @param user 사용자 객체
 * @param permission 확인할 권한 키
 * @returns 권한 보유 여부
 */
export function hasPermission(
  user: User | Omit<User, 'password'> | null,
  permission: keyof AdminPermissions
): boolean {
  if (!isAdminUser(user)) return false

  // adminLevel에 따른 기본 권한 체크
  if (user.adminLevel === 'MASTER') {
    // MASTER는 모든 권한 보유
    return true
  }

  // 커스터마이징된 권한이 있으면 그것을 사용
  if (user.permissions && typeof user.permissions[permission] === 'boolean') {
    return user.permissions[permission] === true
  }

  // 기본 권한 체크 (ADMIN, GENERAL)
  // ADMIN은 대부분의 권한 보유, GENERAL은 제한적
  if (user.adminLevel === 'ADMIN') {
    // ADMIN은 대부분의 권한 보유 (일부 제한적 권한 제외)
    return permission !== 'canDeleteUsers' && permission !== 'canManageSystemSettings'
  }

  // GENERAL은 기본적으로 false
  return false
}

/**
 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
 * @param user 사용자 객체
 * @param permissions 확인할 권한 키 배열
 * @returns 권한 보유 여부
 */
export function hasAnyPermission(
  user: User | Omit<User, 'password'> | null,
  permissions: Array<keyof AdminPermissions>
): boolean {
  if (!isAdminUser(user)) return false
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * 사용자가 모든 권한을 가지고 있는지 확인
 * @param user 사용자 객체
 * @param permissions 확인할 권한 키 배열
 * @returns 모든 권한 보유 여부
 */
export function hasAllPermissions(
  user: User | Omit<User, 'password'> | null,
  permissions: Array<keyof AdminPermissions>
): boolean {
  if (!isAdminUser(user)) return false
  return permissions.every(permission => hasPermission(user, permission))
}
