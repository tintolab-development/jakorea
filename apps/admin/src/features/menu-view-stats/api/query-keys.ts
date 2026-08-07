import type { MenuViewPeriod } from '@/entities/menu-view-stats/model/types'

export const menuViewStatsQueryKeys = {
  all: ['menu-view-stats'] as const,
  stats: (source: 'remote' | 'local', period: MenuViewPeriod | null) =>
    [
      ...menuViewStatsQueryKeys.all,
      'stats',
      source,
      period?.from ?? '',
      period?.to ?? '',
    ] as const,
}
