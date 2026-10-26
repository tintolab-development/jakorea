import { useCallback, useMemo } from 'react'
import {
  saveInquiryCategoriesBulk,
} from '@/features/posts/api/inquiries/admin-inquiries-service'
import {
  useInquiryCategoriesQuery,
  useInquiryCategoryMutations,
} from '@/features/posts/hooks/use-inquiry-categories-query'
import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'
import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'
import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'

export type InquiryCategoryRemoteActions = CategoryRemoteActions

export type UseAdminInquiryCategoriesResult = {
  categoryRows: InquiryCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  remoteActions: InquiryCategoryRemoteActions
}

const EMPTY_CATEGORY_ROWS: InquiryCategoryRow[] = []

export function useAdminInquiryCategories(): UseAdminInquiryCategoriesResult {
  const categoriesQuery = useInquiryCategoriesQuery()
  const { createMutation, updateMutation, deleteMutation } = useInquiryCategoryMutations()
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
      await saveInquiryCategoriesBulk(changes)
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
