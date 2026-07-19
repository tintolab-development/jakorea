import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'

export const MEMBER_DETAIL_SCREEN_CODE = 'SCR_MEMBER'

export type LatestMemberAdminComment = {
  commentId?: number
  comment: string
}

function sortCommentsNewestFirst(comments: AdminCommentResponse[]): AdminCommentResponse[] {
  return [...comments].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt ?? a.createdAt ?? '') || 0
    const bTime = Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0
    return bTime - aTime
  })
}

function filterByScreenCode(
  comments: AdminCommentResponse[],
  screenCode: string
): AdminCommentResponse[] {
  return comments.filter(c => {
    const code = c.screenCode?.trim()
    return !code || code === screenCode
  })
}

export function resolveLatestMemberAdminCommentDetail(
  comments: AdminCommentResponse[] | undefined,
  screenCode = MEMBER_DETAIL_SCREEN_CODE
): LatestMemberAdminComment | undefined {
  if (!comments?.length) return undefined
  const latest = sortCommentsNewestFirst(filterByScreenCode(comments, screenCode))[0]
  const text = latest?.comment?.trim()
  if (!text) return undefined
  return {
    comment: text,
    ...(latest?.commentId != null ? { commentId: latest.commentId } : {}),
  }
}

export function resolveLatestMemberAdminComment(
  comments: AdminCommentResponse[] | undefined,
  screenCode = MEMBER_DETAIL_SCREEN_CODE
): string | undefined {
  return resolveLatestMemberAdminCommentDetail(comments, screenCode)?.comment
}
