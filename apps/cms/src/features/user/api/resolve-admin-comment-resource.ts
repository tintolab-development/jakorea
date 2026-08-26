import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import type { User } from '@/types/user'

export type AdminCommentResourceTarget = 'member' | 'schoolOrganization'

/**
 * 관리자 코멘트 API path param (`/api/admin/users/{id}/comments`).
 * OpenAPI: "대상 리소스 식별자" — 학교 organization은 `organizationId`, 그 외는 `memberId`.
 */
export function resolveAdminCommentResource(
  user: Pick<User, 'role' | 'memberId' | 'organizationId' | 'id'> | null | undefined
): { resourceId: number; target: AdminCommentResourceTarget } | undefined {
  if (!user) return undefined

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
