import type {
  VisitorStatsQuery,
  VisitorStatsResult,
} from '@/entities/visitor-stats/model/types'
import { shouldUseVisitorStatsRemoteApi } from './capabilities'
import { queryVisitorStats } from './store'

const remoteError = 'Visitor stats remote API is not implemented yet'

export async function getVisitorStatsService(
  query: VisitorStatsQuery
): Promise<VisitorStatsResult> {
  if (shouldUseVisitorStatsRemoteApi()) throw new Error(remoteError)
  return queryVisitorStats(query)
}
