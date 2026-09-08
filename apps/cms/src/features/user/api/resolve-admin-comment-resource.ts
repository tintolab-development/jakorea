import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import type { User } from '@/types/user'

export type AdminCommentResourceTarget = 'member' | 'schoolOrganization' | 'adminAccount'

/**
 * 관리자 코멘트 API path param.
 * - 관리자 회원: `GET/POST /api/admin/admin-accounts/{adminAccountId}/comments`
 * - 학교: `/api/admin/users/{organizationId}/comments`
 * - 그 외 회원: `/api/admin/users/{memberId}/comments`
 */
export function resolveAdminCommentResource(
  user: Pick<User, 'role' | 'memberId' | 'organizationId' | 'adminAccountId' | 'id'> | null | undefined
): { resourceId: number; target: AdminCommentResourceTarget } | undefined {
  if (!user) return undefined

  if (user.role === 'ADMIN') {
    const adminAccountId =
      user.adminAccountId ?? parseAdminAccountIdFromUserId(user.id) ?? undefined
    if (adminAccountId != null) {
      return { resourceId: adminAccountId, target: 'adminAccount' }
    }
    if (user.memberId != null) {
      return { resourceId: user.memberId, target: 'member' }
    }
    return undefined
  }

  if (user.role === 'SCHOOL') {
    const organizationId =
      user.organizationId ?? parseOrganizationIdFromUserId(user.id) ?? undefined
    if (organizationId != null) {
      return { resourceId: organizationId, target: 'schoolOrganization' }
    }
    if (user.memberId != null) {
      return { resourceId: user.memberId, target: 'member' }
    }
    return undefined
  }

  if (user.memberId != null) {
    return { resourceId: user.memberId, target: 'member' }
  }

  return undefined
}

export function resolveAdminCommentResourceId(
  user: Pick<User, 'role' | 'memberId' | 'organizationId' | 'id'> | null | undefined
): number | undefined {
  return resolveAdminCommentResource(user)?.resourceId
}
