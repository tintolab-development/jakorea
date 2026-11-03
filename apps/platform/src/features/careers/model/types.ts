export type CareerJobStatus = 'recruiting' | 'result' | 'closed'

export type CareerJobListItem = {
  id: string
  title: string
  status: CareerJobStatus
  statusLabel: string
  publishedAtLabel: string
}

export type CareerPostingAttachment = {
  id: string
  name: string
  fileUrl?: string
}

/** 채용공고 상세. 조회수는 응답에 숫자가 있을 때만 표시한다. */
export type CareerPostingDetail = CareerJobListItem & {
  content: string
  contentFormat: 'html'
  /** publishedOn 날짜, 없으면 publishedAt. 시각이 있으면 `2026년 01월 15일 오후 3:00` */
  publishedAtDetailLabel: string
  /** recruitStart·recruitEnd가 둘 다 있을 때만. CTA: `2026년 5월 15일 ~ 6월 15일` */
  recruitPeriodLabel: string
  viewCount: number | null
  attachments: CareerPostingAttachment[]
  /** 비면 기본 문구. 버튼 노출은 linkUrl 기준. */
  buttonLabel: string
  /** 비어 있으면 상세 하단 버튼을 그리지 않는다. */
  linkUrl: string
}

export type CareerPostingDetailStatus =
  | 'loading'
  | 'ready'
  | 'not-found'
  | 'error'
  | 'unavailable'

export type CareersListParams = {
  tab: 'openings' | 'talent'
  q: string
  page: number
}

export type ThriveValueId = 'impact' | 'speak' | 'learn' | 'help'

export type ThriveValue = {
  id: ThriveValueId
  title: string
  summary: string
  /** PC 시안 줄바꿈. 모바일은 공백으로 이어 자연 개행 */
  summaryLines: readonly string[]
  detail: string
  detailLines: readonly string[]
  tone: 'yellow' | 'mint' | 'sky' | 'lime'
  /** PC 비대칭 그리드 열: left | right */
  column: 'left' | 'right'
  /** 열 내 순서 */
  order: number
}

export type CareersFeaturedStory = {
  id: string
  categoryLabel: string
  title: string
  /** PC 시안 줄바꿈. 없으면 title을 그대로 렌더 */
  titleLines?: readonly string[]
  publishedAtLabel: string
  imageUrl: string
}
