import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import type { Program } from '@/types/domain'

export function useUpdateGeneralProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      programId,
      program,
      patch,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
    }) => updateGeneralProgram(programId, program, patch),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() })
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.detail(variables.programId),
      })
    },
  })
}
