import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTextbook,
  deleteTextbooks,
  updateTextbook,
} from '@/features/textbook/api/admin-textbooks-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import {
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function rowId(row: TextbookRow): string {
  return row.id
}

export function useTextbookMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.textbooks.lists()

  const createMutation = useMutation({
    mutationFn: createTextbook,
    onSuccess: async () => {
      await invalidateArrayLists(queryClient, listsKey)
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
      applyUpdatedToArrayLists(queryClient, listsKey, data, rowId)
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
