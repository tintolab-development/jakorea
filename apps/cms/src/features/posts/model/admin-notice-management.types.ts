import type { Dayjs } from 'dayjs'
import type { Notice } from '@/data/mock/notices'

/** 공지사항 관리 목록 — 필터 카드·URL 동기화용 */
export type AdminNoticeVisibilityFilter = 'ALL' | 'public' | 'private'

export type AdminNoticeCategoryFilter = 'ALL' | Notice['category']

/** useTablePage의 `TFilters extends Record<string, unknown>` 충족 */
export interface AdminNoticePendingFilters extends Record<string, unknown> {
  title: string
  author: string
  visibility: AdminNoticeVisibilityFilter
  category: AdminNoticeCategoryFilter
  dateRange: [Dayjs, Dayjs] | null
}

/** useTablePage context — 공지 목록은 추가 컨텍스트 없음 */
export type AdminNoticeTableContext = Record<string, never>
