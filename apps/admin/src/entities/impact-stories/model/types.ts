/**
 * 임팩트 스토리 도메인
 */

export type ImpactStoryAttachmentMime = 'image/jpeg' | 'image/png'

export type ImpactStoryAttachment = {
  id: string
  name: string
  mime: ImpactStoryAttachmentMime
  /** mock: data URL / remote: publicUrl */
  dataUrl?: string
  /** remote upload용 원본 File (신규 선택 시) */
  file?: File
  /** remote asset id */
  assetId?: number
}

export type ImpactStoryCategory = {
  id: string
  name: string
  sortOrder: number
  /** remote optimistic concurrency */
  version?: number
  /** remote: 연결된 스토리 수 (삭제 가드) */
  storyCount?: number
}

export type ImpactStory = {
  id: string
  categoryId: string
  /** list API 편의 필드 */
  categoryName?: string
  title: string
  /** 에디터 본문 — local은 markdown, remote 응답은 HTML일 수 있음 */
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
  /** Optimistic locking — remote API */
  version?: number
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
