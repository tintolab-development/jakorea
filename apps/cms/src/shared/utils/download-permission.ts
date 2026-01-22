/**
 * 다운로드 권한 체크 유틸리티
 * Phase 4.1: 권한별 다운로드 범위 설정 (FR-F00)
 */

import type { User } from '@/types/user'
import type { UUID } from '@/types'

/**
 * 프로그램별 다운로드 권한 확인
 * @param user 현재 사용자
 * @param programId 프로그램 ID
 * @returns 다운로드 가능 여부
 */
export function canDownloadParticipants(
  user: Omit<User, 'password'> | null,
  programId?: UUID
): boolean {
  if (!user) {
    return false
  }

  // 관리자가 아니면 다운로드 불가
  if (user.role !== 'ADMIN') {
    return false
  }

  // 마스터 관리자는 모든 프로그램 다운로드 가능
  if (user.adminLevel === 'MASTER') {
    return true
  }

  // 프로그램 ID가 없으면 다운로드 불가 (프로그램별 필터 필요)
  if (!programId) {
    return false
  }

  // 담당자(OWNER)만 다운로드 가능
  return user.programRoles?.[programId] === 'OWNER'
}

/**
 * 강사 다운로드 권한 확인
 * @param user 현재 사용자
 * @returns 다운로드 가능 여부
 */
export function canDownloadInstructors(
  user: Omit<User, 'password'> | null
): boolean {
  if (!user) {
    return false
  }

  // 관리자만 다운로드 가능
  return user.role === 'ADMIN'
}
