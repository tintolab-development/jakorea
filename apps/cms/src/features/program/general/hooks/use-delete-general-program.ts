import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGeneralPrograms } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { isProgramHardDeleteBlockedError } from '@/features/program/shared/lib/program-delete-guide'

export function useDeleteGeneralPrograms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (programIds: string[]) => deleteGeneralPrograms(programIds),
    onSuccess: async (_data, programIds) => {
      // 상세 observer가 남아 있으면 removeQueries가 즉시 재fetch → 삭제된 id 404.
      // cancel 후 remove하고, 목록은 invalidate로 맞춘다.
      for (const programId of programIds) {
        const detailKey = generalProgramQueryKeys.detail(programId)
        await queryClient.cancelQueries({ queryKey: detailKey })
        queryClient.removeQueries({ queryKey: detailKey })
      }
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() })
    },
    onError: error => {
      if (!isProgramHardDeleteBlockedError(error) || error.successCount < 1) return
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() })
    },
  })
}
