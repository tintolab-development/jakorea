import { getMemberIdByUuid } from '@/features/user/api/member-id-registry'
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import { parseMemberIdFromUserId } from '@/features/user/detail/lib/resolve-member-detail-restore-hint'
import type { User } from '@/types/user'

export type DeleteUserOptions = {
  memberId?: number
  adminAccountId?: number
  organizationId?: number
  role?: User['role']
  email?: string
  /** 기본: `CMS 관리자 회원 삭제` */
  reason?: string
  /**
   * `POST …/users/{id}/delete` confirmationText.
   * 목록 삭제 = `삭제`, 상세·소속교사 탈퇴 = `탈퇴` (모달 입력과 동일).
   */
  confirmationText?: string
}

/** 목록·상세 User → deleteUser API 옵션 (memberId·adminAccountId·organizationId 힌트 보강) */
export function resolveDeleteUserOptions(user: Omit<User, 'password'>): DeleteUserOptions {
  const memberId =
    user.memberId ??
    getMemberIdByUuid(user.id) ??
    parseMemberIdFromUserId(user.id) ??
    undefined

  const organizationId = user.organizationId ?? parseOrganizationIdFromUserId(user.id)

  return {
    role: user.role,
    adminAccountId: user.adminAccountId,
    memberId,
    organizationId,
    email: user.email,
  }
}
