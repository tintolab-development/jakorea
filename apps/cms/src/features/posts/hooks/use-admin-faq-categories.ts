import { useCallback, useMemo } from 'react'
import {
  useFaqCategoriesQuery,
  useFaqCategoryMutations,
} from '@/features/posts/hooks/use-faq-categories-query'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'

export type FaqCategoryRemoteActions = {
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export type UseAdminFaqCategoriesResult = {
  categoryRows: FaqCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  remoteActions: FaqCategoryRemoteActions
}

const EMPTY_CATEGORY_ROWS: FaqCategoryRow[] = []

export function useAdminFaqCategories(): UseAdminFaqCategoriesResult {
  const categoriesQuery = useFaqCategoriesQuery()
  const { createMutation, updateMutation, deleteMutation } = useFaqCategoryMutations()

  const categoryRows = categoriesQuery.data ?? EMPTY_CATEGORY_ROWS

  const allowedCategoryLabels = useMemo(
    () => categoryRows.map(r => r.name),
    [categoryRows]
  )

  const allowedCategorySet = useMemo(
    () => new Set(allowedCategoryLabels),
    [allowedCategoryLabels]
  )

  const onCreate = useCallback(
    async (name: string) => {
      await createMutation.mutateAsync(name)
    },
    [createMutation.mutateAsync]
  )

  const onUpdate = useCallback(
    async (id: string, name: string) => {
      await updateMutation.mutateAsync({ id, name })
    },
    [updateMutation.mutateAsync]
  )

  const onDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation.mutateAsync]
  )

  const remoteActions = useMemo(
    () => ({ onCreate, onUpdate, onDelete }),
    [onCreate, onDelete, onUpdate]
  )

  return {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    remoteActions,
  }
}
