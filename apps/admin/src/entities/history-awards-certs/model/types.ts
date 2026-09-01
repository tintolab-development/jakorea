/**
 * 연혁·수상·인증 관리 도메인 타입
 */

export type PublicFilterValue = '' | 'true' | 'false'

export type HistorySortKey = 'event' | 'created'
export type AwardSortKey = 'date' | 'created'
export type CertSortKey = 'date' | 'created'

export type HistoryItem = {
  id: string
  isPublic: boolean
  year: number
  month: number
  content: string
  createdAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type HistoryCreateInput = {
  isPublic: boolean
  year: number
  month: number
  content: string
}

export type HistoryListFilter = {
  isPublic?: boolean
  year?: number
  month?: number
  content?: string
  createdFrom?: string
  createdTo?: string
  sort?: HistorySortKey
}

export type AwardItem = {
  id: string
  isPublic: boolean
  title: string
  organization: string
  awardedOn: string
  createdAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type AwardCreateInput = {
  isPublic: boolean
  title: string
  organization: string
  awardedOn: string
}

export type AwardListFilter = {
  isPublic?: boolean
  title?: string
  organization?: string
  awardedFrom?: string
  awardedTo?: string
  createdFrom?: string
  createdTo?: string
  sort?: AwardSortKey
}

export type CertItem = {
  id: string
  isPublic: boolean
  content: string
  organization: string
  certifiedOn: string
  createdAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type CertCreateInput = {
  isPublic: boolean
  content: string
  organization: string
  certifiedOn: string
}

export type CertListFilter = {
  isPublic?: boolean
  content?: string
  organization?: string
  certifiedFrom?: string
  certifiedTo?: string
  createdFrom?: string
  createdTo?: string
  sort?: CertSortKey
}
