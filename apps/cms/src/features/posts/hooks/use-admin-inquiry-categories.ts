import { useCallback, useMemo } from 'react'
import {
  useInquiryCategoriesQuery,
  useInquiryCategoryMutations,
} from '@/features/posts/hooks/use-inquiry-categories-query'
import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'

export type InquiryCategoryRemoteActions = {
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

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
