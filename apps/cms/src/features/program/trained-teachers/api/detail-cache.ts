import type { QueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { listGeneralProgramSurveyCacheInvalidationQueryKeys } from '@/features/program/general/lib/general-program-survey-cache-invalidation'
import { syncOpenProgramDetailCache } from '@/features/program/shared/lib/program-detail-cache-after-save'
import { invalidateTrainedTeacherListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { trainedTeacherQueryKeys } from './query-keys'

/**
 * 설문 진행 항목이 바뀐 뒤 같이 갱신할 쿼리.
 * 상세 키는 넣지 않는다. 상세는 setQueryData로 반영하고, 무효화 refetch가 구 GET으로 덮지 않게 한다.
 */
export function listTrainedTeacherSurveyReflectionQueryKeys(programId: string) {
  return [
    generalProgramQueryKeys.navigation(programId),
    ...listGeneralProgramSurveyCacheInvalidationQueryKeys(programId),
    trainedTeacherQueryKeys.organizationApplicationsProgram(programId),
    trainedTeacherQueryKeys.participatingInstitutionsProgram(programId),
    trainedTeacherQueryKeys.educationCompletionsProgram(programId),
    trainedTeacherQueryKeys.performanceSummary(programId),
    trainedTeacherQueryKeys.programSchedules(programId),
  ]
}

/** 저장 직후 재조회한 원격 응답을 그대로 상세 캐시에 반영한다. */
export async function reflectTrainedTeacherProgramSave(
  queryClient: QueryClient,
  input: {
    programId: string
    echoed: Program
  }
): Promise<Program> {
  const detailKey = trainedTeacherQueryKeys.detail(input.programId)
  const next = { ...input.echoed, id: input.programId || input.echoed.id }
  await syncOpenProgramDetailCache(queryClient, detailKey, next, { refetch: false })
  invalidateTrainedTeacherListCaches(queryClient)
  await Promise.all(
    listTrainedTeacherSurveyReflectionQueryKeys(input.programId).map(queryKey =>
      queryClient.invalidateQueries({ queryKey })
    )
  )
  return next
}
