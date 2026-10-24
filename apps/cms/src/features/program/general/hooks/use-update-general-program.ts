import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  programDetailCacheFromSave,
  syncOpenProgramDetailCache,
} from '@/features/program/shared/lib/program-detail-cache-after-save'
import { invalidateGeneralProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import type { Program } from '@/types/domain'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'

export function useUpdateGeneralProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: ({
      programId,
      program,
      patch,
      baseline,
      serializeOptions,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
      baseline?: Program
      serializeOptions?: GeneralProgramUpdateSerializeOptions
    }) => updateGeneralProgram(programId, program, patch, baseline, serializeOptions),
    onSuccess: async (updated, variables) => {
      const detailKey = generalProgramQueryKeys.detail(variables.programId)
      const assignmentsKey = generalProgramQueryKeys.sponsorAssignments(variables.programId)
      await syncOpenProgramDetailCache(
        queryClient,
        detailKey,
        programDetailCacheFromSave(
          variables.programId,
          updated,
          variables.program,
          variables.patch
        ),
        { refetch: false }
      )
      await queryClient.invalidateQueries({ queryKey: detailKey })
      await queryClient.invalidateQueries({ queryKey: assignmentsKey })
      invalidateGeneralProgramListCaches(queryClient)
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.navigation(variables.programId),
      })
    },
  })
}
