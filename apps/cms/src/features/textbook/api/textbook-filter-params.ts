import { DATA_MANAGEMENT_LIST_PAGE_SIZE } from '@/features/data-management/api/data-management-list-page'
import type { TextbooksParams } from '@/shared/api/generated/data-management/schemas'

export type TextbookListFilters = {
  businessArea: string
  educationTarget: string
  grade: string
  textbookName: string
  /** 선택 박스 — 전체(`ALL`, 기본) / 사용 / 미사용 */
  useStatus: TextbookUseStatusFilter
}

export type TextbookUseStatusFilter = 'ALL' | 'USED' | 'UNUSED'

export const TEXTBOOK_LIST_PAGE_SIZE = DATA_MANAGEMENT_LIST_PAGE_SIZE

/** 목록 API에 `grade` 쿼리를 보낼지 — 빈 값·레거시 ALL은 미전송 */
export function isTextbookGradeFilterActive(grade: string): boolean {
  const normalized = grade.trim()
  return normalized.length > 0 && normalized !== 'ALL'
}

export function textbooksParamsFromFilters(
  filters: TextbookListFilters,
  page = 0
): TextbooksParams {
  const params: TextbooksParams = {
    page,
    size: TEXTBOOK_LIST_PAGE_SIZE,
  }

  if (filters.useStatus !== 'ALL') params.useStatus = filters.useStatus

  if (filters.businessArea !== 'ALL') params.businessArea = filters.businessArea
  if (filters.educationTarget !== 'ALL') params.educationTarget = filters.educationTarget
  if (isTextbookGradeFilterActive(filters.grade)) params.grade = filters.grade.trim()

  const textbookName = filters.textbookName.trim()
  if (textbookName) params.textbookName = textbookName

  return params
}

/** URL `tb_use` → 사용 여부 필터. 없거나 알 수 없는 값이면 전체(`ALL`) */
export function parseTextbookUseStatus(raw: string | null | undefined): TextbookUseStatusFilter {
  if (raw === 'USED' || raw === 'UNUSED') return raw
  return 'ALL'
}

export function serializeTextbookFilters(filters: TextbookListFilters): string {
  return JSON.stringify(filters)
}
