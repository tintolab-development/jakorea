import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'

export const MEMBER_DETAIL_SCREEN_CODE = 'SCR_MEMBER'

/**
 * 관리자 코멘트 — 대상·화면(screenCode)마다 1건 (QA-0044).
 * 등록 API를 다시 호출하면 서버가 같은 건을 덮어쓴다.
 */
export type MemberAdminComment = {
  commentId?: number
  comment: string
}

/** `memberQueryKeys.comments` 캐시 값 — 코멘트가 없으면 `null` */
export type MemberAdminCommentQueryData = MemberAdminComment | null

/**
 * 목록 응답(배열)에서 해당 화면의 코멘트 1건을 고른다.
 * 응답은 0~1건이므로 정렬·최신 선택 없이 screenCode가 같은 건(없으면 screenCode 미지정 건)을 쓴다.
 */
export function resolveMemberAdminComment(
  comments: AdminCommentResponse[] | undefined,
  screenCode = MEMBER_DETAIL_SCREEN_CODE
): MemberAdminComment | undefined {
  if (!comments?.length) return undefined
  const found =
    comments.find(c => c.screenCode?.trim() === screenCode) ??
    comments.find(c => !c.screenCode?.trim())
  const text = found?.comment?.trim()
  if (!text) return undefined
  return {
    comment: text,
    ...(found?.commentId != null ? { commentId: found.commentId } : {}),
  }
}
