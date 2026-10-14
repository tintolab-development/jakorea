import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  programDetailCacheFromSave,
  syncOpenProgramDetailCache,
} from '@/features/program/shared/lib/program-detail-cache-after-save'
import { invalidateGeneralProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import type { Program } from '@/types/domain'

export function useUpdateGeneralProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      programId,
      program,
      patch,
      baseline,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
      baseline?: Program
    }) => updateGeneralProgram(programId, program, patch, baseline),
    onSuccess: async (updated, variables) => {
      const detailKey = generalProgramQueryKeys.detail(variables.programId)
      await syncOpenProgramDetailCache(
        queryClient,
        detailKey,
        programDetailCacheFromSave(
          variables.programId,
          updated,
          variables.program,
          variables.patch
        )
      )
      invalidateGeneralProgramListCaches(queryClient)
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.navigation(variables.programId),
      })
    },
  })
}
