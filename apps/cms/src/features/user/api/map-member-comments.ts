import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'

export const MEMBER_DETAIL_SCREEN_CODE = 'SCR_MEMBER'

export function resolveLatestMemberAdminComment(
  comments: AdminCommentResponse[] | undefined,
  screenCode = MEMBER_DETAIL_SCREEN_CODE
): string | undefined {
  if (!comments?.length) return undefined
  const filtered = comments.filter(c => {
    const code = c.screenCode?.trim()
    return !code || code === screenCode
  })
  const sorted = [...filtered].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt ?? a.createdAt ?? '') || 0
    const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0
    return bTime - aTime
  })
  const latest = sorted[0]?.comment?.trim()
  return latest || undefined
}
