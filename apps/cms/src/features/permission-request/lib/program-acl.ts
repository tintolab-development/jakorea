/**
 * 프로그램 ACL (Access Control List) 유틸리티
 * Phase 0.5.2: 프로그램 단위 ACL 범위 외 접근 금지 (NFR-SEC-ACC-01)
 * FSD: features 레이어로 이동 (shared는 entities 미참조)
 */

import type { User } from '@/types/user'
import type { Program } from '@/types/domain'
import { checkPermissionSync } from '@/entities/permission-request/api/permission-request-service'

/**
 * 사용자가 특정 프로그램에 접근할 수 있는지 확인
 */
export function canAccessProgram(
  user: Omit<User, 'password'> | null,
  programId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW'
): boolean {
  if (!user) {
    return false
  }

  if (action === 'VIEW') {
    if (user.role === 'ADMIN') {
      if (user.adminLevel === 'MASTER') {
        return true
      }
      const hasTemporaryPermission = checkPermissionSync(user.id, programId, action)
      if (hasTemporaryPermission) {
        return true
      }
      // 권한 설정 V1.2 원칙 3: 담당자로 지정된 프로그램이면 역할(Owner·Assistant·Viewer)과 무관하게 상세 조회 가능
      const programRole = user.programRoles?.[programId]
      return programRole === 'OWNER' || programRole === 'PARTNER' || programRole === 'ASSISTANT'
    }
    if (['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'].includes(user.role)) {
      return true
    }
    return false
  }

  if (user.role !== 'ADMIN') {
    return false
  }

  if (user.adminLevel === 'MASTER') {
    return true
  }

  const hasTemporaryPermission = checkPermissionSync(user.id, programId, action)
  if (hasTemporaryPermission) {
    return true
  }

  const programRole = user.programRoles?.[programId]
  if (programRole === 'OWNER') {
    return true
  }
  // Program Assistant: 프로그램 정보 수정 등 운영 권한은 Owner와 같고, 파일 다운로드도 허용(지급조서는 마스킹본 — BE 처리)
  if (programRole === 'PARTNER') {
    return action === 'EDIT' || action === 'DOWNLOAD'
  }
  // Program Viewer(프로그램 상세): 수정·다운로드 제한
  return false
}

/**
 * 프로그램 객체에 대한 접근 권한 확인
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
 */
export function filterProgramsByACL<T extends { id: string }>(
  programs: T[],
  user: Omit<User, 'password'> | null,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT' = 'VIEW'
): T[] {
  if (!user) {
    return []
  }
  if (user.role === 'ADMIN' && user.adminLevel === 'MASTER') {
    return programs
  }
  return programs.filter(program => canAccessProgram(user, program.id, action))
}
