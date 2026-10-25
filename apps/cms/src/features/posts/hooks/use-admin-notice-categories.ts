import { useCallback, useMemo } from 'react'
import {
  saveNoticeCategoriesBulk,
} from '@/features/posts/api/notices/admin-notices-service'
import {
  useNoticeCategoriesQuery,
  useNoticeCategoryMutations,
} from '@/features/posts/hooks/use-notice-categories-query'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'
import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'

import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'

export type NoticeCategoryRemoteActions = CategoryRemoteActions

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
  const createCategory = createMutation.mutateAsync
  const updateCategory = updateMutation.mutateAsync
  const deleteCategory = deleteMutation.mutateAsync
  const refetchCategories = categoriesQuery.refetch

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
      await createCategory(name)
    },
    [createCategory]
  )

  const onUpdate = useCallback(
    async (id: string, name: string) => {
      await updateCategory({ id, name })
    },
    [updateCategory]
  )

  const onDelete = useCallback(
    async (id: string) => {
      await deleteCategory(id)
    },
    [deleteCategory]
  )

  const onSave = useCallback(
    async (changes: CategoryManagementDraftChanges) => {
      await saveNoticeCategoriesBulk(changes)
      await refetchCategories()
    },
    [refetchCategories]
  )

  const remoteActions = useMemo(
    () => ({ onCreate, onUpdate, onDelete, onSave }),
    [onCreate, onDelete, onSave, onUpdate]
  )

  return {
    categoryRows,
    allowedCategoryLabels,
    allowedCategorySet,
    remoteActions,
  }
}
