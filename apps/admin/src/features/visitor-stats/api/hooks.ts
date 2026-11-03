import { useQuery } from '@tanstack/react-query'
import type { VisitorStatsQuery } from '@/entities/visitor-stats/model/types'
import { shouldUseVisitorStatsRemoteApi } from './capabilities'
import { visitorStatsQueryKeys } from './query-keys'
import { getVisitorStatsMetadataService, getVisitorStatsService } from './service'

const VISITOR_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
)

const METADATA_STALE_MS = 5 * 60_000

function source(): 'remote' | 'local' {
  return shouldUseVisitorStatsRemoteApi() ? 'remote' : 'local'
}

export function useVisitorStatsMetadata() {
  const dataSource = source()
  return useQuery({
    queryKey: visitorStatsQueryKeys.metadata(dataSource),
    queryFn: getVisitorStatsMetadataService,
    staleTime: METADATA_STALE_MS,
    gcTime: 30 * 60_000,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useVisitorStats(query: VisitorStatsQuery) {
  const dataSource = source()
  const metadataQuery = useVisitorStatsMetadata()

  return useQuery({
    queryKey: visitorStatsQueryKeys.stats(dataSource, query),
    queryFn: () => getVisitorStatsService(query, metadataQuery.data!),
    enabled: Boolean(metadataQuery.data),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useVisitorStatsFilterOptions() {
  const metadataQuery = useVisitorStatsMetadata()
  return {
    years: metadataQuery.data?.years ?? [],
    months: VISITOR_MONTH_OPTIONS,
    isLoading: metadataQuery.isLoading,
    isError: metadataQuery.isError,
  }
}
