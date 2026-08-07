import { useQuery } from '@tanstack/react-query'
import type { MenuViewPeriod } from '@/entities/menu-view-stats/model/types'
import { shouldUseMenuViewStatsRemoteApi } from './capabilities'
import { menuViewStatsQueryKeys } from './query-keys'
import { getMenuViewStatsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseMenuViewStatsRemoteApi() ? 'remote' : 'local'
}

export function useMenuViewStats(period: MenuViewPeriod | null) {
  const dataSource = source()
  const enabled = Boolean(period?.from && period?.to)

  return useQuery({
    queryKey: menuViewStatsQueryKeys.stats(dataSource, period),
    queryFn: () => {
      if (!period?.from || !period?.to) {
        throw new Error('기간이 필요합니다.')
      }
      return getMenuViewStatsService({ from: period.from, to: period.to })
    },
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}
