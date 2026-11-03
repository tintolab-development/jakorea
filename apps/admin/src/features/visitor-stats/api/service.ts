import type {
  VisitorStatsMetadata,
  VisitorStatsQuery,
  VisitorStatsResult,
} from '@/entities/visitor-stats/model/types'
import { getJAKoreaHomepageAdminAPIStatisticsSubset } from '@/shared/api/generated/statistics/statistics-api'
import {
  mapVisitorStatisticsMetadata,
  mapVisitorStatisticsToDomain,
  toVisitorsParams,
} from './mappers'

function statisticsApi() {
  return getJAKoreaHomepageAdminAPIStatisticsSubset()
}

export async function getVisitorStatsMetadataService(): Promise<VisitorStatsMetadata> {
  const response = await statisticsApi().visitorsMetadata()
  return mapVisitorStatisticsMetadata(response)
}

export async function getVisitorStatsService(
  query: VisitorStatsQuery,
  bounds: VisitorStatsMetadata,
): Promise<VisitorStatsResult> {
  const response = await statisticsApi().visitors(toVisitorsParams(query, bounds))
  return mapVisitorStatisticsToDomain(response, query)
}
