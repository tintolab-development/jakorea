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

export function useAdminNoticeCategories(): UseAdminNoticeCategoriesResult {
  const categoriesQuery = useNoticeCategoriesQuery()
  const { createMutation, updateMutation, deleteMutation } = useNoticeCategoryMutations()

  const categoryRows = useMemo<NoticeCategoryRow[]>(
    () => (categoriesQuery.data ?? []).map(row => ({ id: row.id, name: row.name })),
    [categoriesQuery.data]
  )

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
    [createMutation]
  )

  const onUpdate = useCallback(
    async (id: string, name: string) => {
      await updateMutation.mutateAsync({ id, name })
    },
    [updateMutation]
  )

  const onDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation]
  )

  return {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    remoteActions: { onCreate, onUpdate, onDelete },
  }
}
