import type { AdminPostsPendingDateRange } from '@/features/posts/lib/url-date-range-pending-sync'
import type { PostsCategoryRow } from '@/features/posts/model/posts-category-row'

/** FAQ 관리 목록 — 필터 카드·URL 동기화용 */
/** 'ALL' = 공개·비공개 모두 (시안 기본값) */
export type AdminFaqVisibilityFilter = 'ALL' | 'public' | 'private'

/** 동적 카테고리 라벨(URL `af_cat`·필터 select와 동기화) */
export type AdminFaqCategoryFilter = 'ALL' | string

/** useTablePage의 `TFilters extends Record<string, unknown>` 충족 */
export interface AdminFaqPendingFilters extends Record<string, unknown> {
  title: string
  author: string
  visibility: AdminFaqVisibilityFilter
  category: AdminFaqCategoryFilter
  dateRange: AdminPostsPendingDateRange
}

/** 카테고리 관리 모달 행 */
export type FaqCategoryRow = PostsCategoryRow

/** useTablePage context — 허용 카테고리 라벨(필터·URL 파싱) */
export type AdminFaqTableContext = {
  allowedCategoryLabels: readonly string[]
}
