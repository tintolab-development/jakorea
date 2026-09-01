import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDetailedProgram,
  deleteDetailedPrograms,
  updateDetailedProgram,
} from '@/features/detailed-program/api/admin-detailed-programs-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { DetailedProgramManagementRow } from '@/features/detailed-program/model/detailed-program-management.types'
import {
  applyCreatedToArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function rowId(row: DetailedProgramManagementRow): string {
  return row.id
}

export function useDetailedProgramMutations() {
  const queryClient = useQueryClient()
  const listsKey = dataManagementQueryKeys.detailedPrograms.lists()

  const createMutation = useMutation({
    mutationFn: createDetailedProgram,
    onSuccess: async created => {
      if (!created.id) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.detailedPrograms.detail(created.id), created)
      applyCreatedToArrayLists(queryClient, listsKey, created, rowId)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; active: boolean } }) =>
      updateDetailedProgram(id, input),
    onSuccess: async updated => {
      if (!updated.id) {
        await invalidateArrayLists(queryClient, listsKey)
        return
      }
      queryClient.setQueryData(dataManagementQueryKeys.detailedPrograms.detail(updated.id), updated)
      applyUpdatedToArrayLists(queryClient, listsKey, updated, rowId)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDetailedPrograms,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: dataManagementQueryKeys.detailedPrograms.detail(id) })
        applyDeletedToArrayLists(queryClient, listsKey, id, rowId)
      }
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
