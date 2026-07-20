import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDetailedProgram,
  deleteDetailedPrograms,
  updateDetailedProgram,
} from '@/features/detailed-program/api/admin-detailed-programs-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'

export function useDetailedProgramMutations(searchParamsKey: string) {
  const queryClient = useQueryClient()
  const listKey = dataManagementQueryKeys.detailedPrograms.list(searchParamsKey)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: listKey })
  }

  const createMutation = useMutation({
    mutationFn: createDetailedProgram,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; active: boolean } }) =>
      updateDetailedProgram(id, input),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDetailedPrograms,
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, deleteMutation }
}
