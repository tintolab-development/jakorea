import type {
  VisitorStatsQuery,
  VisitorStatsResult,
} from '@/entities/visitor-stats/model/types'
import { getJAKoreaHomepageAdminAPIStatisticsSubset } from '@/shared/api/generated/statistics/statistics-api'
import { shouldUseVisitorStatsRemoteApi } from './capabilities'
import { mapVisitorStatisticsToDomain, toVisitorsParams } from './mappers'
import { queryVisitorStats } from './store'

function statisticsApi() {
  return getJAKoreaHomepageAdminAPIStatisticsSubset()
}

export async function getVisitorStatsService(
  query: VisitorStatsQuery,
): Promise<VisitorStatsResult> {
  if (shouldUseVisitorStatsRemoteApi()) {
    const response = await statisticsApi().visitors(toVisitorsParams(query))
    return mapVisitorStatisticsToDomain(response, query)
  }
  return queryVisitorStats(query)
}
