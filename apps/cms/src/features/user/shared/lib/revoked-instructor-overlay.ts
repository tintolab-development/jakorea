import type { User } from '@/types/user'

/**
 * 목록 API가 instructorStatus/REVOKED를 안 내려도 세션 동안
 * 「강사(권한박탈)」 표시·강사 목록 제외를 유지하기 위한 클라이언트 오버레이.
 */
const revokedUserIds = new Set<string>()
const revokedMemberIds = new Set<number>()

export function markInstructorPermissionRevoked(
  user: Partial<Pick<User, 'id' | 'memberId'>>
): void {
  const id = user.id?.trim()
  if (id) revokedUserIds.add(id)
  if (typeof user.memberId === 'number' && Number.isFinite(user.memberId)) {
    revokedMemberIds.add(user.memberId)
  }
}

export function isInstructorPermissionRevokedOverlay(
  user: Partial<Pick<User, 'id' | 'memberId'>>
): boolean {
  const id = user.id?.trim()
  if (id && revokedUserIds.has(id)) return true
  if (typeof user.memberId === 'number' && revokedMemberIds.has(user.memberId)) {
    return true
  }
  return false
}
