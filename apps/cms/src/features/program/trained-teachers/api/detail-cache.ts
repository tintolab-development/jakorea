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
  ]
}

/**
 * 저장 직후 GET이 정본이다. 설문 키·overlay만 이번 저장 값으로 덮는다.
 * patch 전체를 얹으면 `undefined` 필드가 GET의 제목·장소 등을 지운다.
 */
function trainedTeacherDetailAfterProgramSave(
  programId: string,
  echoed: Program,
  draft: Program,
  patch?: Partial<Program>
): Program {
  const generalSurveyMenuKeys =
    patch?.generalSurveyMenuKeys !== undefined
      ? patch.generalSurveyMenuKeys
      : draft.generalSurveyMenuKeys !== undefined
        ? draft.generalSurveyMenuKeys
        : echoed.generalSurveyMenuKeys
  const registrationOverlay =
    patch?.registrationOverlay ?? draft.registrationOverlay ?? echoed.registrationOverlay
  return {
    ...echoed,
    id: programId || echoed.id,
    ...(generalSurveyMenuKeys !== undefined ? { generalSurveyMenuKeys } : {}),
    ...(registrationOverlay !== undefined ? { registrationOverlay } : {}),
  }
}

/** 열린 교육받은 교사 상세가 구독하는 키에 설문 키·overlay를 반영하고, 파생 설문 쿼리만 무효화한다. */
export async function reflectTrainedTeacherProgramSave(
  queryClient: QueryClient,
  input: {
    programId: string
    echoed: Program
    draft: Program
    patch?: Partial<Program>
  }
): Promise<Program> {
  const detailKey = trainedTeacherQueryKeys.detail(input.programId)
  const next = trainedTeacherDetailAfterProgramSave(
    input.programId,
    input.echoed,
    input.draft,
    input.patch
  )
  await syncOpenProgramDetailCache(queryClient, detailKey, next, { refetch: false })
  invalidateTrainedTeacherListCaches(queryClient)
  await Promise.all(
    listTrainedTeacherSurveyReflectionQueryKeys(input.programId).map(queryKey =>
      queryClient.invalidateQueries({ queryKey })
    )
  )
  return next
}
