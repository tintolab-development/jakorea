import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGeneralPrograms } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

export function useDeleteGeneralPrograms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (programIds: string[]) => deleteGeneralPrograms(programIds),
    onSuccess: (_data, programIds) => {
      for (const programId of programIds) {
        queryClient.removeQueries({ queryKey: generalProgramQueryKeys.detail(programId) })
      }
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() })
    },
  })
}
