import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGeneralPrograms } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

export function useDeleteGeneralPrograms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (programIds: string[]) => deleteGeneralPrograms(programIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.all })
    },
  })
}
