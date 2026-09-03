import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTextbook,
  deleteTextbooks,
  updateTextbook,
} from '@/features/textbook/api/admin-textbooks-service'
import type { TextbookListFilters } from '@/features/textbook/api/textbook-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import {
  applyCreatedToMatchingArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToMatchingArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function rowId(row: TextbookRow): string {
  return row.id
}

function listFiltersFromQueryKey(queryKey: readonly unknown[]): TextbookListFilters | null {
  const raw = queryKey[queryKey.length - 1]
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as TextbookListFilters
  } catch {
    return null
  }
}

function textbookMatchesListFilter(queryKey: readonly unknown[], row: TextbookRow): boolean {
  const filters = listFiltersFromQueryKey(queryKey)
  if (!filters) return true
  if (filters.useStatus !== row.useStatus) return false
  if (filters.businessArea !== 'ALL' && filters.businessArea !== row.businessArea) return false
  if (filters.educationTarget !== 'ALL' && filters.educationTarget !== row.educationTarget) {
    return false
  }
  if (filters.grade !== 'ALL' && filters.grade !== row.grade) return false
  const nameQ = filters.textbookName.trim()
  if (nameQ && !row.textbookName.includes(nameQ)) return false
  return true
}

export function useTextbookMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.textbooks.lists()

  const createMutation = useMutation({
    mutationFn: createTextbook,
    onSuccess: async created => {
      if (!created?.id) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.textbooks.detail(created.id), created)
      applyCreatedToMatchingArrayLists(
        queryClient,
        listsKey,
        created,
        rowId,
        textbookMatchesListFilter
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateTextbook>[1] }) =>
      updateTextbook(id, input),
    onSuccess: async (data, variables) => {
      if (!data?.id) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.textbooks.detail(variables.id), data)
      applyUpdatedToMatchingArrayLists(
        queryClient,
        listsKey,
        data,
        rowId,
        textbookMatchesListFilter
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTextbooks,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.textbooks.detail(id) })
        applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      }
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
