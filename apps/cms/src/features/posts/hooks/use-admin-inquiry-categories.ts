/**
 * 문의 카테고리 목록 — mock 저장소와 React 상태 동기화
 */

import { useCallback, useMemo, useState } from 'react'
import {
  listInquiryCategoryRows,
  replaceInquiryCategoryRows,
} from '@/features/posts/api/admin-inquiry-category-mock-store'
import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'

export type UseAdminInquiryCategoriesResult = {
  categoryRows: InquiryCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  replaceCategories: (next: InquiryCategoryRow[]) => void
}

export function useAdminInquiryCategories(): UseAdminInquiryCategoriesResult {
  const [categoryRows, setCategoryRows] = useState<InquiryCategoryRow[]>(() =>
    listInquiryCategoryRows()
  )

  const replaceCategories = useCallback((next: InquiryCategoryRow[]) => {
    replaceInquiryCategoryRows(next)
    setCategoryRows(listInquiryCategoryRows())
  }, [])

  const allowedCategoryLabels = useMemo(
    () => categoryRows.map(r => r.name),
    [categoryRows]
  )

  const allowedCategorySet = useMemo(
    () => new Set(allowedCategoryLabels),
    [allowedCategoryLabels]
  )

  return {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    replaceCategories,
  }
}
