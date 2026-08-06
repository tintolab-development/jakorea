/**
 * 임팩트 스토리 도메인
 */

export type ImpactStoryAttachmentMime = 'image/jpeg' | 'image/png'

export type ImpactStoryAttachment = {
  id: string
  name: string
  mime: ImpactStoryAttachmentMime
  /** mock: data URL */
  dataUrl?: string
}

export type ImpactStoryCategory = {
  id: string
  name: string
  sortOrder: number
}

export type ImpactStory = {
  id: string
  categoryId: string
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
  attachments: ImpactStoryAttachment[]
}

export type ImpactStoryListFilter = {
  visibility?: 'public' | 'private'
  categoryId?: string
  title?: string
  authorName?: string
  publishedFrom?: string
  publishedTo?: string
  createdFrom?: string
  createdTo?: string
}

export type ImpactStoryCreateInput = {
  categoryId: string
  title: string
  contentMarkdown: string
  isPublic: boolean
  isPinned: boolean
  publishedAt: string
  authorName: string
  attachments: ImpactStoryAttachment[]
}

export type ImpactStoryUpdateInput = ImpactStoryCreateInput & {
  id: string
}

/**
 * 홈페이지 노출 조건 (플랫폼 연동 시 동일 규칙 적용 예정)
 * — 공개 + 게시일시 도래
 */
export function isHomepageVisible(story: ImpactStory, now = new Date()): boolean {
  if (!story.isPublic) return false
  const published = new Date(story.publishedAt)
  if (Number.isNaN(published.getTime())) return false
  return published.getTime() <= now.getTime()
}
