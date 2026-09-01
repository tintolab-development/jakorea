export type NoticesListParams = {
  q: string
  page: number
}

export type NoticeAttachment = {
  name: string
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

/** 공지 상세 — CMS Notice 상세 필드와 동기 */
export type NoticeDetail = NoticeListItem & {
  content: string
  author: string
  viewCount: number
  /** 상세 메타용 — 예: 2026년 05월 08일(월) */
  publishedAtDetailLabel: string
  attachments: NoticeAttachment[]
}
