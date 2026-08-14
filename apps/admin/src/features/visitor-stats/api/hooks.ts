import { useQuery } from '@tanstack/react-query'
import type { VisitorStatsQuery } from '@/entities/visitor-stats/model/types'
import { shouldUseVisitorStatsRemoteApi } from './capabilities'
import {
  VISITOR_STATS_SEED_YEARS,
} from './mappers'
import { visitorStatsQueryKeys } from './query-keys'
import { getVisitorStatsService } from './service'
import { listVisitorMonthOptions, listVisitorYearOptions } from './store'

function source(): 'remote' | 'local' {
  return shouldUseVisitorStatsRemoteApi() ? 'remote' : 'local'
}

export function useVisitorStats(query: VisitorStatsQuery) {
  const dataSource = source()

  return useQuery({
    queryKey: visitorStatsQueryKeys.stats(dataSource, query),
    queryFn: () => getVisitorStatsService(query),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useVisitorStatsFilterOptions() {
  if (shouldUseVisitorStatsRemoteApi()) {
    return {
      years: [...VISITOR_STATS_SEED_YEARS],
      months: listVisitorMonthOptions(),
    }
  }
  return {
    years: listVisitorYearOptions(),
    months: listVisitorMonthOptions(),
  }
}
