/**
 * 공개 공지 — Homepage Admin OpenAPI 계약
 * GET /api/public/ja-korea/notices · GET /api/public/ja-korea/notices/{id}
 */

export type PublicNoticeListItem = {
  id?: number
  pinned?: boolean
  publishAt?: string
  title?: string
  authorName?: string
  viewCount?: number
}

export type PublicNoticeAttachment = {
  assetId?: number
  originalName?: string
  publicUrl?: string
}

export type PublicNoticeDetail = {
  id?: number
  pinned?: boolean
  publishAt?: string
  title?: string
  body?: string
  attachments?: PublicNoticeAttachment[]
  authorName?: string
  viewCount?: number
}

export type PublicNoticeListPage = {
  items?: PublicNoticeListItem[]
  totalCount?: number
  page?: number
  size?: number
  totalPages?: number
}

export type PublicNoticeListQuery = {
  /** 제목·본문 부분일치. 빈 값이면 보내지 않음 */
  q?: string
  page?: number
  size?: number
}
