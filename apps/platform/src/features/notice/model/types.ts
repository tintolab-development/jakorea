export type NoticesListParams = {
  q: string
  page: number
}

export type NoticeContentFormat = 'html' | 'markdown'

export type NoticeAttachment = {
  id: string
  name: string
  mime?: string
  size?: number
  /** 다운로드 URL. 식별자와 분리 — 서명 URL·파일 ID 다운로드에 대비 */
  fileUrl?: string
}

export type NoticeListItem = {
  id: string
  /** 목록 표시용 번호 */
  no: number
  title: string
  isPinned: boolean
  /** ISO date string */
  publishedAt: string
  /** 표시용 — 예: 2026년 05월 08일 */
  publishedAtLabel: string
}

/** 공지 상세 — 공개 GET attachments[] */
export type NoticeDetail = NoticeListItem & {
  content: string
  contentFormat: NoticeContentFormat
  author: string
  viewCount: number
  /** 상세 메타용 — 예: 2026년 01월 15일 오후 3:00 */
  publishedAtDetailLabel: string
  attachments: NoticeAttachment[]
}

export type NoticeDetailStatus = 'loading' | 'ready' | 'not-found' | 'error' | 'unavailable'
