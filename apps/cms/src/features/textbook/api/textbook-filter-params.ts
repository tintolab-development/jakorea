import { DATA_MANAGEMENT_LIST_PAGE_SIZE } from '@/features/data-management/api/data-management-list-page'
import type { TextbooksParams } from '@/shared/api/generated/data-management/schemas'

export type TextbookListFilters = {
  businessArea: string
  educationTarget: string
  grade: string
  textbookName: string
  /** 라디오 — 사용 / 미사용만 (전체 없음) */
  useStatus: 'USED' | 'UNUSED'
}

export const TEXTBOOK_LIST_PAGE_SIZE = DATA_MANAGEMENT_LIST_PAGE_SIZE

export function textbooksParamsFromFilters(
  filters: TextbookListFilters,
  page = 0
): TextbooksParams {
  const params: TextbooksParams = {
    page,
    size: TEXTBOOK_LIST_PAGE_SIZE,
    useStatus: filters.useStatus,
  }

  if (filters.businessArea !== 'ALL') params.businessArea = filters.businessArea
  if (filters.educationTarget !== 'ALL') params.educationTarget = filters.educationTarget
  if (filters.grade !== 'ALL') params.grade = filters.grade

  const textbookName = filters.textbookName.trim()
  if (textbookName) params.textbookName = textbookName

  return params
}

export function parseTextbookUseStatus(raw: string | null): 'USED' | 'UNUSED' {
  return raw === 'UNUSED' ? 'UNUSED' : 'USED'
}

export function serializeTextbookFilters(filters: TextbookListFilters): string {
  return JSON.stringify(filters)
}
