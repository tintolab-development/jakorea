import type { AdminPostsPendingDateRange } from '@/features/posts/lib/url-date-range-pending-sync'

/** 공지사항 관리 목록 — 필터 카드·URL 동기화용 */
export type AdminNoticeVisibilityFilter = 'ALL' | 'public' | 'private'

/** 동적 카테고리 라벨(URL `an_cat`·필터 select와 동기화) */
export type AdminNoticeCategoryFilter = 'ALL' | string

/** useTablePage의 `TFilters extends Record<string, unknown>` 충족 */
export interface AdminNoticePendingFilters extends Record<string, unknown> {
  title: string
  author: string
  visibility: AdminNoticeVisibilityFilter
  category: AdminNoticeCategoryFilter
  dateRange: AdminPostsPendingDateRange
}

/** 카테고리 관리 모달 행 */
export type NoticeCategoryRow = {
  id: string
  name: string
}

/** useTablePage context — 허용 카테고리 라벨(필터·URL 파싱) */
export type AdminNoticeTableContext = {
  allowedCategoryLabels: readonly string[]
}
