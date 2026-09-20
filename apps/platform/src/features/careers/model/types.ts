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
