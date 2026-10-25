import type { QueryClient } from '@tanstack/react-query'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { geminiVisitingTrainingQueryKeys } from '@/features/program/gemini/api/visiting-training/query-keys'

export function invalidateProgramAdminDetailQueries(
  queryClient: QueryClient,
  programId: string
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.detail(programId) }),
    queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() }),
    queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.detail(programId) }),
    queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.overviewStages() }),
    queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.detail(programId) }),
    queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.overviewStages() }),
    queryClient.invalidateQueries({ queryKey: ujatQueryKeys.details() }),
    queryClient.invalidateQueries({ queryKey: ujatQueryKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(programId),
    }),
  ]).then(() => undefined)
}
