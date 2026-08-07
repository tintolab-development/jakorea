import type {
  MenuViewPeriod,
  MenuViewStatsResult,
} from '@/entities/menu-view-stats/model/types'
import { shouldUseMenuViewStatsRemoteApi } from './capabilities'
import { readMenuViewStats } from './store'

const remoteError = 'Menu view stats remote API is not implemented yet'

export async function getMenuViewStatsService(
  period: MenuViewPeriod
): Promise<MenuViewStatsResult> {
  if (shouldUseMenuViewStatsRemoteApi()) throw new Error(remoteError)
  return readMenuViewStats(period)
}
