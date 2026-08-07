/**
 * 홈페이지 어드민 공지사항 도메인
 */

export type NoticeAttachmentMime = 'image/jpeg' | 'image/png'

export type NoticeAttachment = {
  id: string
  name: string
  mime: NoticeAttachmentMime
  /** mock: data URL */
  dataUrl?: string
}

export type Notice = {
  id: string
  title: string
  contentMarkdown: string
  isPublic: boolean
  isPinned: boolean
  authorName: string
  /** ISO — 홈 게시 기준 */
  publishedAt: string
  createdAt: string
  updatedAt: string
  viewCount: number
  attachments: NoticeAttachment[]
}

export type NoticeListFilter = {
  visibility?: 'public' | 'private'
  title?: string
  authorName?: string
  publishedFrom?: string
  publishedTo?: string
  createdFrom?: string
  createdTo?: string
}

export type NoticeCreateInput = {
  title: string
  contentMarkdown: string
  isPublic: boolean
  isPinned: boolean
  publishedAt: string
  authorName: string
  attachments: NoticeAttachment[]
}

export type NoticeUpdateInput = NoticeCreateInput & {
  id: string
}

/**
 * 홈페이지 노출 조건 (플랫폼 연동 시 동일 규칙 적용 예정)
 * — 공개 + 게시일시 도래
 */
export function isHomepageVisible(notice: Notice, now = new Date()): boolean {
  if (!notice.isPublic) return false
  const published = new Date(notice.publishedAt)
  if (Number.isNaN(published.getTime())) return false
  return published.getTime() <= now.getTime()
}
