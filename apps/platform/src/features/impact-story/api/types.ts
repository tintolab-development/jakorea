/**
 * GET /api/public/impact-story/* 계약 (Admin OpenAPI Public* 와 동일, Platform 로컬 타입)
 */

export type PublicCategoryResponse = {
  id?: number
  name?: string
}

export type PublicStoryListItem = {
  id?: number
  pinned?: boolean
  publishAt?: string
  categoryId?: number
  categoryName?: string
  title?: string
  summary?: string
  imageUrl?: string
  authorName?: string
  viewCount?: number
}

export type PublicStoryAttachment = {
  assetId?: number
  originalName?: string
  publicUrl?: string
}

export type PublicStoryDetail = PublicStoryListItem & {
  body?: string
  attachments?: PublicStoryAttachment[]
}

export type PublicStoryListPage = {
  items?: PublicStoryListItem[]
  totalCount?: number
  page?: number
  size?: number
  totalPages?: number
}

export type PublicStoryListQuery = {
  categoryId?: number
  q?: string
  page?: number
  size?: number
}
