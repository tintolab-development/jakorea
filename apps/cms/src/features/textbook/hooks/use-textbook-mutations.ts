import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTextbook,
  deleteTextbooks,
  updateTextbook,
} from '@/features/textbook/api/admin-textbooks-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'

export function useTextbookMutations(listFilterKey: string) {
  const queryClient = useQueryClient()
  const listKey = dataManagementQueryKeys.textbooks.list(listFilterKey)

  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: listKey })
  }

  const createMutation = useMutation({
    mutationFn: createTextbook,
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateTextbook>[1] }) =>
      updateTextbook(id, input),
    onSuccess: (_data, variables) => {
      invalidateList()
      void queryClient.invalidateQueries({
        queryKey: dataManagementQueryKeys.textbooks.detail(variables.id),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTextbooks,
    onSuccess: invalidateList,
  })

  return { createMutation, updateMutation, deleteMutation }
}
