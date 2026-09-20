export type CareerJobStatus = 'recruiting' | 'result' | 'closed'

export type CareerJobListItem = {
  id: string
  title: string
  status: CareerJobStatus
  statusLabel: string
  publishedAtLabel: string
}

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
  detail: string
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
  publishedAtLabel: string
  imageUrl: string
}
