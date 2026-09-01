import { useCallback, useMemo } from 'react'
import {
  useNoticeCategoriesQuery,
  useNoticeCategoryMutations,
} from '@/features/posts/hooks/use-notice-categories-query'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

export type NoticeCategoryRemoteActions = {
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export type UseAdminNoticeCategoriesResult = {
  categoryRows: NoticeCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  remoteActions: NoticeCategoryRemoteActions
}

const EMPTY_CATEGORY_ROWS: NoticeCategoryRow[] = []

export function useAdminNoticeCategories(): UseAdminNoticeCategoriesResult {
  const categoriesQuery = useNoticeCategoriesQuery()
  const { createMutation, updateMutation, deleteMutation } = useNoticeCategoryMutations()

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
