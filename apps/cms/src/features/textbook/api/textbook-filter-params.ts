import type { TextbookUseStatus } from '@/features/textbook/model/textbook.types'
import type { TextbooksParams } from '@/shared/api/generated/data-management/schemas'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'

export type TextbookListFilters = {
  businessArea: string
  educationTarget: string
  grade: string
  textbookName: string
  useStatus: TextbookUseStatus
}

export const TEXTBOOK_LIST_PAGE_SIZE = 500

export function textbooksParamsFromFilters(filters: TextbookListFilters): TextbooksParams {
  const params: TextbooksParams = {
    page: 0,
    size: TEXTBOOK_LIST_PAGE_SIZE,
  }

  if (filters.businessArea !== 'ALL') params.businessArea = filters.businessArea
  if (filters.educationTarget !== 'ALL') params.educationTarget = filters.educationTarget
  if (filters.useStatus !== 'ALL') params.useStatus = filters.useStatus

  return params
}

/** grade·교재명 서버 필터 없음 — 클라이언트 보조 */
export function clientFilterTextbooks(rows: TextbookRow[], filters: TextbookListFilters): TextbookRow[] {
  const keyword = filters.textbookName.trim().toLowerCase()
  return rows.filter(row => {
    if (filters.grade !== 'ALL' && row.grade !== filters.grade) return false
    if (keyword.length > 0 && !row.textbookName.toLowerCase().includes(keyword)) return false
    return true
  })
}

export function serializeTextbookFilters(filters: TextbookListFilters): string {
  return JSON.stringify(filters)
}
