/** CMS 공지 카테고리와 동일 계약 — apps/cms NoticeCategoryRow */
export type NoticeCategory = {
  id: string
  name: string
}

export type ResultSort = 'latest' | 'title'

export type ResultsListParams = {
  /** categoryId 또는 `'all'` */
  category: string
  q: string
  sort: ResultSort
  page: number
}

export type ResultAttachment = {
  name: string
  fileUrl?: string
}

export type ResultListItem = {
  id: string
  title: string
  categoryId: string
  categoryName: string
  /** ISO date string (발표일 = 작성일) */
  announcedAt: string
  /** 표시용 — 예: 2026년 09월 15일 */
  announcedAtLabel: string
}

/** 결과 확인 상세 — CMS Notice 상세 필드와 동기 */
export type ResultDetail = ResultListItem & {
  content: string
  author: string
  viewCount: number
  /** 상세 메타용 — 예: 2026년 01월 15일 오후 3:00 */
  announcedAtDetailLabel: string
  attachments: ResultAttachment[]
}
