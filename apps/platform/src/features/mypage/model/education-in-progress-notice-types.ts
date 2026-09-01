export type EducationInProgressNotice = {
  id: string
  title: string
  content: string
  authorName: string
  publishedAt: string
  read: boolean
  viewCount: number
  commentCount: number
  reactionCount: number
  /** 현재 로그인 사용자가 작성자인지 — 더보기(수정/삭제) 노출 */
  isAuthor?: boolean
}

export type EducationNoticeReactionSummary = {
  emojiType: string
  count: number
}

export type EducationNoticeReactionUser = {
  id: string
  noticeId: string
  authorName: string
  emojiType: string
}

export type EducationInProgressFile = {
  id: string
  fileName: string
  uploadedAt: string
  fileSizeBytes: number
  postId?: string
}

export function getNoticeAttachments(
  noticeId: string,
  files: EducationInProgressFile[],
): EducationInProgressFile[] {
  return files.filter(file => file.postId === noticeId)
}

/** 안내사항 상세 — 첨부 1건 UI용 */
export function getFirstNoticeAttachment(
  noticeId: string,
  files: EducationInProgressFile[],
): EducationInProgressFile | undefined {
  return getNoticeAttachments(noticeId, files)[0]
}
