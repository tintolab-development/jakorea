import type { QueryClient } from '@tanstack/react-query'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { companySchoolProgramsInfiniteQueryOptions } from '@/features/program/1c-1s/api/hooks'
import {
  companySchoolListParamsFromOverviewStatus,
  readCompanySchoolTableFilters,
} from '@/features/program/1c-1s/api/list-params'
import {
  generalProgramListInfiniteQueryOptions,
  readGeneralProgramTableFilters,
} from '@/features/program/general/api/general-program-list-query'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { trainedTeacherProgramsInfiniteQueryOptions } from '@/features/program/trained-teachers/api/hooks'
import {
  readTrainedTeacherTableFilters,
  trainedTeacherListParamsFromOverviewStatus,
} from '@/features/program/trained-teachers/api/list-params'
import type { OverviewStageProgramType } from './refresh-overview-on-stage-change'

type OverviewStageStatus = 'scheduled' | 'in_progress' | 'completed'

function toOverviewStageStatus(stageKey: string): OverviewStageStatus | null {
  return stageKey === 'scheduled' || stageKey === 'in_progress' || stageKey === 'completed'
    ? stageKey
    : null
}

/**
 * 상단 4카드 hover/focus 시 이동할 단계의 목록 첫 페이지를 미리 받아 둔다.
 * 목록 훅과 같은 queryOptions·현재 URL 테이블 필터를 써서 키가 일치하므로, 클릭 시 캐시가 바로 쓰인다.
 * 캐시가 staleTime 안이면 prefetch는 요청을 보내지 않는다.
 */
export function prefetchOverviewStageList(
  queryClient: QueryClient,
  programType: OverviewStageProgramType,
  stageKey: string,
  search: string
): void {
  const status = toOverviewStageStatus(stageKey)
  const searchParams = new URLSearchParams(search)

  if (programType === 'general') {
    if (!shouldUseGeneralProgramsRemoteApi()) return
    void queryClient.prefetchInfiniteQuery(
      generalProgramListInfiniteQueryOptions(status, readGeneralProgramTableFilters(searchParams))
    )
    return
  }

  if (programType === 'company_school') {
    if (!shouldUseCompanySchoolRemoteApi()) return
    void queryClient.prefetchInfiniteQuery(
      companySchoolProgramsInfiniteQueryOptions(
        companySchoolListParamsFromOverviewStatus(
          status,
          readCompanySchoolTableFilters(searchParams)
        )
      )
    )
    return
  }

  if (!shouldUseTrainedTeacherProgramsRemoteApi()) return
  void queryClient.prefetchInfiniteQuery(
    trainedTeacherProgramsInfiniteQueryOptions(
      trainedTeacherListParamsFromOverviewStatus(
        status,
        readTrainedTeacherTableFilters(key => searchParams.get(key))
      ),
      true
    )
  )
}
