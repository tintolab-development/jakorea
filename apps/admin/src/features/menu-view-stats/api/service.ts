import type {
  MenuViewPeriod,
  MenuViewStatsResult,
} from '@/entities/menu-view-stats/model/types'
import { getJAKoreaHomepageAdminAPIStatisticsSubset } from '@/shared/api/generated/statistics/statistics-api'
import { shouldUseMenuViewStatsRemoteApi } from './capabilities'
import { mapMenuStatisticsToDomain, toMenusParams } from './mappers'
import { readMenuViewStats } from './store'

function statisticsApi() {
  return getJAKoreaHomepageAdminAPIStatisticsSubset()
}

export async function getMenuViewStatsService(
  period: MenuViewPeriod,
): Promise<MenuViewStatsResult> {
  if (shouldUseMenuViewStatsRemoteApi()) {
    const response = await statisticsApi().menus(toMenusParams(period))
    return mapMenuStatisticsToDomain(response, period)
  }
  return readMenuViewStats(period)
}
