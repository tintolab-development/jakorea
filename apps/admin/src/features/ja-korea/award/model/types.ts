/**
 * 수상 관리 — Notion 1-5
 */

export type AwardVisibility = 'public' | 'private'

export type AwardItem = {
  id: string
  visibility: AwardVisibility
  /** 상명 */
  title: string
  /** 수여 기관명 */
  organization: string
  /** 수상일 (YYYY-MM-DD) — 어드민은 일까지, 홈페이지는 연·월 */
  awardedOn: string
  createdAt: string
  updatedAt: string
}

export type AwardDraft = {
  visibility: AwardVisibility
  title: string
  organization: string
  awardedOn: string | null
}

export type AwardVisibilityFilter = 'all' | AwardVisibility

export type AwardSort = 'awarded-desc' | 'created-desc'

export type AwardFilters = {
  visibility: AwardVisibilityFilter
  title: string
  organization: string
  awardedFrom: string | null
  awardedTo: string | null
  createdFrom: string | null
  createdTo: string | null
}
