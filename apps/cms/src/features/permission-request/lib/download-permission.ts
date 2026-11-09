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
  // Program Owner·Program Assistant 허용(Assistant 지급조서는 주민등록번호·계좌번호 마스킹본 — BE 처리). Program Viewer 제한.
  const programRole = user.programRoles?.[programId]
  return programRole === 'OWNER' || programRole === 'PARTNER'
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
 * 권한 설정 V1.2: 지급조서 다운로드는 Program Owner(원본)·Program Assistant(마스킹본)
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
  // Program Owner·Program Assistant 허용(Assistant 지급조서는 주민등록번호·계좌번호 마스킹본 — BE 처리). Program Viewer 제한.
  const programRole = user.programRoles?.[programId]
  return programRole === 'OWNER' || programRole === 'PARTNER'
}
