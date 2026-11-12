import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateFaqLists } from '@/features/posts/lib/faq-query-cache'
import {
  saveFaqCategoriesBulk,
} from '@/features/posts/api/faqs/admin-faqs-service'
import {
  useFaqCategoriesQuery,
  useFaqCategoryMutations,
} from '@/features/posts/hooks/use-faq-categories-query'
import type { CategoryRemoteActions } from '@/features/posts/hooks/category-remote-actions'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'
import type { CategoryManagementDraftChanges } from '@/features/posts/model/category-management-draft'

export type FaqCategoryRemoteActions = CategoryRemoteActions

export type UseAdminFaqCategoriesResult = {
  categoryRows: FaqCategoryRow[]
  allowedCategoryLabels: readonly string[]
  allowedCategorySet: ReadonlySet<string>
  remoteActions: FaqCategoryRemoteActions
}

const EMPTY_CATEGORY_ROWS: FaqCategoryRow[] = []

export function useAdminFaqCategories(): UseAdminFaqCategoriesResult {
  const queryClient = useQueryClient()
  const categoriesQuery = useFaqCategoriesQuery()
  const { createMutation, updateMutation, deleteMutation } = useFaqCategoryMutations()
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
      await saveFaqCategoriesBulk(changes)
      // QA-0286: 선택지만이 아니라 목록 행의 카테고리명도 새 이름으로 다시 조회
      await Promise.all([refetchCategories(), invalidateFaqLists(queryClient)])
    },
    [queryClient, refetchCategories]
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
