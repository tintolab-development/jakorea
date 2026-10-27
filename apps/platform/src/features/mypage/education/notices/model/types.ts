export type EducationInProgressNotice = {
  id: string
  title: string
  content: string
  authorName: string
  /** CMS·관리자 작성 — 작성자명 primary 강조 */
  authorIsStaff?: boolean
  publishedAt: string
  read: boolean
  viewCount: number
  commentCount: number
  reactionCount: number
  /** 현재 로그인 사용자가 작성자인지 — 더보기(수정/삭제) 노출 */
  isAuthor?: boolean
  /** 원격 목록 `attachmentCount` */
  attachmentCount?: number
  visibilityType?: string
  inlineImages?: EducationNoticeInlineImage[]
}

export type EducationNoticeInlineImage = {
  fileObjectId: number
  referenceToken: string
  contentPath?: string
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
  reactedAt: string
}

export type EducationNoticeComment = {
  id: string
  noticeId: string
  authorName: string
  content: string
  createdAt: string
  /** 원격: 서버 `mine` — 있으면 작성자 이름 비교보다 우선 */
  mine?: boolean
}

export type EducationInProgressFile = {
  id: string
  /** 원격 첨부 교체 API에 전달할 실제 file_object.id */
  fileObjectId?: number
  fileName: string
  uploadedAt: string
  fileSizeBytes: number
  postId?: string
  /** 원격: 회원 Bearer 다운로드 resolve 경로 */
  downloadPath?: string
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
