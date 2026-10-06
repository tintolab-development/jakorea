import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'

export type OverviewStageProgramType = 'general' | 'company_school' | 'trained_teachers'

/** 연속 클릭 시 중복 요청을 막는 최소 캐시 나이 — 이보다 최근 데이터는 그대로 쓴다 */
export const OVERVIEW_STAGE_REFRESH_MIN_AGE_MS = 5_000

const OVERVIEW_CACHE_KEYS: Record<
  OverviewStageProgramType,
  { overviewStages: QueryKey; lists: QueryKey }
> = {
  general: {
    overviewStages: generalProgramQueryKeys.overviewStages(),
    lists: generalProgramQueryKeys.lists(),
  },
  company_school: {
    overviewStages: companySchoolQueryKeys.overviewStages(),
    lists: companySchoolQueryKeys.lists(),
  },
  trained_teachers: {
    overviewStages: trainedTeacherQueryKeys.overviewStages(),
    lists: trainedTeacherQueryKeys.lists(),
  },
}

/**
 * 상단 4카드 위젯 단계 이동 시 건수·목록 캐시 갱신.
 * - 건수(overviewStages): 활성 쿼리이므로 즉시 refetch
 * - 목록(lists): 다른 단계로 이동하면 stale 표시만 하고, URL 반영 후 새 키 observer가 fetch
 *   (이동 전 단계 목록을 불필요하게 refetch하지 않음). 같은 단계 재클릭이면 현재 목록 refetch
 */
export function refreshOverviewCachesOnStageChange(
  queryClient: QueryClient,
  programType: OverviewStageProgramType,
  options: { sameStage: boolean; now?: number }
): void {
  const keys = OVERVIEW_CACHE_KEYS[programType]
  const now = options.now ?? Date.now()
  const isOldEnough = (dataUpdatedAt: number) =>
    now - dataUpdatedAt >= OVERVIEW_STAGE_REFRESH_MIN_AGE_MS

  void queryClient.invalidateQueries({
    queryKey: keys.overviewStages,
    exact: true,
    predicate: query => isOldEnough(query.state.dataUpdatedAt),
  })
  void queryClient.invalidateQueries({
    queryKey: keys.lists,
    refetchType: options.sameStage ? 'active' : 'none',
    predicate: query => isOldEnough(query.state.dataUpdatedAt),
  })
}
