import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import {
  OVERVIEW_STAGE_REFRESH_MIN_AGE_MS,
  refreshOverviewCachesOnStageChange,
} from './refresh-overview-on-stage-change'

function seed(queryClient: QueryClient, queryKey: readonly unknown[], updatedAt: number) {
  queryClient.setQueryData(queryKey, { seeded: true }, { updatedAt })
}

function isInvalidated(queryClient: QueryClient, queryKey: readonly unknown[]): boolean {
  return queryClient.getQueryState(queryKey)?.isInvalidated ?? false
}

describe('refreshOverviewCachesOnStageChange', () => {
  const now = 1_000_000

  it('general: 오래된 건수·목록 캐시를 무효화한다', () => {
    const queryClient = new QueryClient()
    const old = now - OVERVIEW_STAGE_REFRESH_MIN_AGE_MS
    seed(queryClient, generalProgramQueryKeys.overviewStages(), old)
    seed(queryClient, generalProgramQueryKeys.list('scheduled'), old)
    seed(queryClient, generalProgramQueryKeys.list(null), old)

    refreshOverviewCachesOnStageChange(queryClient, 'general', { sameStage: false, now })

    expect(isInvalidated(queryClient, generalProgramQueryKeys.overviewStages())).toBe(true)
    expect(isInvalidated(queryClient, generalProgramQueryKeys.list('scheduled'))).toBe(true)
    expect(isInvalidated(queryClient, generalProgramQueryKeys.list(null))).toBe(true)
  })

  it('최근(최소 나이 미만) 캐시는 무효화하지 않는다', () => {
    const queryClient = new QueryClient()
    const fresh = now - OVERVIEW_STAGE_REFRESH_MIN_AGE_MS + 1
    seed(queryClient, generalProgramQueryKeys.overviewStages(), fresh)
    seed(queryClient, generalProgramQueryKeys.list('in_progress'), fresh)

    refreshOverviewCachesOnStageChange(queryClient, 'general', { sameStage: false, now })

    expect(isInvalidated(queryClient, generalProgramQueryKeys.overviewStages())).toBe(false)
    expect(isInvalidated(queryClient, generalProgramQueryKeys.list('in_progress'))).toBe(false)
  })

  it('다른 프로그램 유형 캐시는 건드리지 않는다', () => {
    const queryClient = new QueryClient()
    const old = now - OVERVIEW_STAGE_REFRESH_MIN_AGE_MS
    seed(queryClient, companySchoolQueryKeys.overviewStages(), old)
    seed(queryClient, trainedTeacherQueryKeys.overviewStages(), old)
    seed(queryClient, generalProgramQueryKeys.overviewStages(), old)
    seed(queryClient, generalProgramQueryKeys.detail('p-1'), old)

    refreshOverviewCachesOnStageChange(queryClient, 'company_school', { sameStage: true, now })

    expect(isInvalidated(queryClient, companySchoolQueryKeys.overviewStages())).toBe(true)
    expect(isInvalidated(queryClient, trainedTeacherQueryKeys.overviewStages())).toBe(false)
    expect(isInvalidated(queryClient, generalProgramQueryKeys.overviewStages())).toBe(false)
    expect(isInvalidated(queryClient, generalProgramQueryKeys.detail('p-1'))).toBe(false)
  })
})
