import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import type { Program } from '@/types/domain'

export function useCreateGeneralProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: generalProgramQueryKeys.mutations.create(),
    mutationFn: (program: Program) => createGeneralProgram(program),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.all })
    },
  })
}
