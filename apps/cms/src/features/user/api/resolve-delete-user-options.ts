import { getMemberIdByUuid } from '@/features/user/api/member-id-registry'
import { parseMemberIdFromUserId } from '@/features/user/detail/lib/resolve-member-detail-restore-hint'
import type { User } from '@/types/user'

export type DeleteUserOptions = {
  memberId?: number
  adminAccountId?: number
  role?: User['role']
  email?: string
}

/** 목록·상세 User → deleteUser API 옵션 (memberId·adminAccountId 힌트 보강) */
export function resolveDeleteUserOptions(user: Omit<User, 'password'>): DeleteUserOptions {
  const memberId =
    user.memberId ??
    getMemberIdByUuid(user.id) ??
    parseMemberIdFromUserId(user.id) ??
    undefined

  return {
    role: user.role,
    adminAccountId: user.adminAccountId,
    memberId,
    email: user.email,
  }
}
