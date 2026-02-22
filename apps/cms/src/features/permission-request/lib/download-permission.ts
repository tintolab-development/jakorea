/**
 * 다운로드 권한 체크 유틸리티
 * Phase 4.1: 권한별 다운로드 범위 설정 (FR-F00)
 * Phase 0.5.2: 임시 권한 부여 지원
 * FSD: features 레이어로 이동 (shared는 entities 미참조)
 */

import type { User } from '@/types/user'
import type { UUID } from '@/types'
import { checkPermissionSync } from '@/entities/permission-request/api/permission-request-service'

/**
 * 프로그램별 다운로드 권한 확인
 */
export function canDownloadParticipants(
  user: Omit<User, 'password'> | null,
  programId?: UUID
): boolean {
  if (!user) {
    return false
  }
  if (user.role !== 'ADMIN') {
    return false
  }
  if (user.adminLevel === 'MASTER') {
    return true
  }
  if (!programId) {
    return false
  }
  const hasTemporaryPermission = checkPermissionSync(user.id, programId, 'DOWNLOAD')
  if (hasTemporaryPermission) {
    return true
  }
  return user.programRoles?.[programId] === 'OWNER'
}

/**
 * 강사 다운로드 권한 확인
 */
export function canDownloadInstructors(
  user: Omit<User, 'password'> | null
): boolean {
  if (!user) {
    return false
  }
  return user.role === 'ADMIN'
}

/**
 * Phase 0.4.3: 지급조서 다운로드 권한 확인
 * FR-G03: 지급조서 엑셀 다운로드는 메인 담당자(OWNER)만 가능
 */
export function canDownloadPaymentStatement(
  user: Omit<User, 'password'> | null,
  programId?: UUID
): boolean {
  if (!user) {
    return false
  }
  if (user.role !== 'ADMIN') {
    return false
  }
  if (user.adminLevel === 'MASTER') {
    return true
  }
  if (!programId) {
    return false
  }
  const hasTemporaryPermission = checkPermissionSync(user.id, programId, 'DOWNLOAD')
  if (hasTemporaryPermission) {
    return true
  }
  return user.programRoles?.[programId] === 'OWNER'
}
