/**
 * 연혁 관리 — Notion 1-4
 */

export type HistoryVisibility = 'public' | 'private'

export type HistoryItem = {
  id: string
  /** 공개 여부 */
  visibility: HistoryVisibility
  year: number
  month: number
  content: string
  createdAt: string
  updatedAt: string
}

export type HistoryDraft = {
  visibility: HistoryVisibility
  year: number | null
  month: number | null
  content: string
}

export type HistoryVisibilityFilter = 'all' | HistoryVisibility

export type HistorySort = 'history-desc' | 'created-desc'

export type HistoryFilters = {
  visibility: HistoryVisibilityFilter
  year: number | 'all'
  month: number | 'all'
  content: string
  createdFrom: string | null
  createdTo: string | null
}
