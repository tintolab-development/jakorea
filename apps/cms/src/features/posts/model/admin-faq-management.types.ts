import type { Dayjs } from 'dayjs'

/** FAQ 관리 목록 — 필터 카드·URL 동기화용 */
export type AdminFaqVisibilityFilter = 'ALL' | 'public' | 'private'

/** 동적 카테고리 라벨(URL `af_cat`·필터 select와 동기화) */
export type AdminFaqCategoryFilter = 'ALL' | string

/** useTablePage의 `TFilters extends Record<string, unknown>` 충족 */
export interface AdminFaqPendingFilters extends Record<string, unknown> {
  title: string
  author: string
  visibility: AdminFaqVisibilityFilter
  category: AdminFaqCategoryFilter
  dateRange: [Dayjs, Dayjs] | null
}

/** 카테고리 관리 모달 행 */
export type FaqCategoryRow = {
  id: string
  name: string
}

/** useTablePage context — 허용 카테고리 라벨(필터·URL 파싱) */
export type AdminFaqTableContext = {
  allowedCategoryLabels: readonly string[]
}
