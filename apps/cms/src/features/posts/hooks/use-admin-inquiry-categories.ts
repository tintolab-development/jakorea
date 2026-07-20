import { useMemo } from 'react'
import type { AdminInquiryRow, InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'

export type UseAdminInquiryCategoriesResult = {
  categoryRows: InquiryCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
}

export function useAdminInquiryCategories(
  inquiryRows: readonly AdminInquiryRow[] = []
): UseAdminInquiryCategoriesResult {
  const categoryRows = useMemo<InquiryCategoryRow[]>(() => {
    const labels = new Set<string>()
    for (const row of inquiryRows) {
      const label = row.category.trim()
      if (label) labels.add(label)
    }
    return [...labels].sort().map((name, index) => ({
      id: `inq-cat-${index}`,
      name,
    }))
  }, [inquiryRows])

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
  }
}
