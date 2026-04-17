/**
 * FAQ 카테고리 목록 — mock 저장소와 React 상태 동기화
 */

import { useCallback, useMemo, useState } from 'react'
import {
  listFaqCategoryRows,
  replaceFaqCategoryRows,
} from '@/features/posts/api/admin-faq-category-mock-store'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'

export type UseAdminFaqCategoriesResult = {
  categoryRows: FaqCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  replaceCategories: (next: FaqCategoryRow[]) => void
}

export function useAdminFaqCategories(): UseAdminFaqCategoriesResult {
  const [categoryRows, setCategoryRows] = useState<FaqCategoryRow[]>(() =>
    listFaqCategoryRows()
  )

  const replaceCategories = useCallback((next: FaqCategoryRow[]) => {
    replaceFaqCategoryRows(next)
    setCategoryRows(listFaqCategoryRows())
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
