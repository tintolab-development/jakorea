/**
 * 프로그램 ACL (Access Control List) 유틸리티
 * Phase 0.5.2: 프로그램 단위 ACL 범위 외 접근 금지 (NFR-SEC-ACC-01)
 */

import type { User } from '@/types/user'
import type { Program } from '@/types/domain'
import { checkPermissionSync } from '@/entities/permission-request/api/permission-request-service'

/**
 * 사용자가 특정 프로그램에 접근할 수 있는지 확인
 * @param user 현재 사용자
 * @param programId 프로그램 ID
 * @param action 접근 액션 ('VIEW' | 'DOWNLOAD' | 'EDIT')
 * @returns 접근 가능 여부
 */
export function canAccessProgram(
  user: Omit<User, 'password'> | null,
  programId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW'
): boolean {
  if (!user) {
    return false
  }

  // VIEW 액션의 경우: 강사, 개인, 학교도 프로그램 조회 가능
  if (action === 'VIEW') {
    // 관리자는 ACL 체크 진행
    if (user.role === 'ADMIN') {
      // 마스터 관리자는 모든 프로그램 접근 가능
      if (user.adminLevel === 'MASTER') {
        return true
      }

      // Phase 0.5.2: 임시 권한 확인 (승인된 권한 요청)
      const hasTemporaryPermission = checkPermissionSync(user.id, programId, action)
      if (hasTemporaryPermission) {
        return true
      }

      // 일반 관리자는 자신이 OWNER인 프로그램만 접근 가능
      const programRole = user.programRoles?.[programId]
      if (programRole === 'OWNER') {
        return true
      }

      // PARTNER는 VIEW만 가능
      if (programRole === 'PARTNER' && action === 'VIEW') {
        return true
      }

      return false
    }

    // 강사, 개인, 학교는 VIEW 권한 허용 (프로그램 조회는 가능)
    if (['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'].includes(user.role)) {
      return true
    }

    return false
  }

  // DOWNLOAD, EDIT 액션은 관리자만 가능
  if (user.role !== 'ADMIN') {
    return false
  }

  // 마스터 관리자는 모든 프로그램 접근 가능
  if (user.adminLevel === 'MASTER') {
    return true
  }

  // Phase 0.5.2: 임시 권한 확인 (승인된 권한 요청)
  const hasTemporaryPermission = checkPermissionSync(user.id, programId, action)
  if (hasTemporaryPermission) {
    return true
  }

  // 일반 관리자는 자신이 OWNER인 프로그램만 접근 가능
  const programRole = user.programRoles?.[programId]
  if (programRole === 'OWNER') {
    return true
  }

  // PARTNER는 VIEW만 가능
  if (programRole === 'PARTNER' && action === 'VIEW') {
    return true
  }

  return false
}

/**
 * 프로그램 객체에 대한 접근 권한 확인
 * @param user 현재 사용자
 * @param program 프로그램 객체
 * @param action 접근 액션
 * @returns 접근 가능 여부
 */
export function canAccessProgramItem(
  user: Omit<User, 'password'> | null,
  program: Program,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW'
): boolean {
  return canAccessProgram(user, program.id, action)
}

/**
 * 프로그램 목록을 ACL에 따라 필터링
 * @param programs 프로그램 목록
 * @param user 현재 사용자
 * @param action 접근 액션
 * @returns 필터링된 프로그램 목록
 */
export function filterProgramsByACL<T extends { id: string }>(
  programs: T[],
  user: Omit<User, 'password'> | null,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW'
): T[] {
  if (!user) {
    return []
  }

  // 마스터 관리자는 모든 프로그램 접근 가능
  if (user.role === 'ADMIN' && user.adminLevel === 'MASTER') {
    return programs
  }

  // 일반 관리자는 자신이 권한이 있는 프로그램만 필터링
  return programs.filter(program => canAccessProgram(user, program.id, action))
}
