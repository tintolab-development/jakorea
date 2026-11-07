import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchPortalCalendar, fetchPortalDashboard } from './client'
import type { MypageProgramStats } from '../../model/types'
import type { MypageScheduleEvent } from '../model/schedule-types'
import { mapPortalDashboardStats, mapPortalScheduleItems, portalCalendarRange } from './mappers'

const DASHBOARD_STALE_MS = 30_000
const CALENDAR_STALE_MS = 60_000
const GC_MS = 10 * 60_000

function remoteSessionEnabled(enabled: boolean): boolean {
  return enabled && isRemoteApiConfigured() && Boolean(getAccessToken())
}

/** 홈 통계 카드 — GET /api/portal/me/dashboard 의 applications만. 일정은 calendar 훅. */
export function usePortalDashboardQuery(enabled: boolean): {
  stats: MypageProgramStats | undefined
  isLoading: boolean
} {
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.dashboard(),
    queryFn: ({ signal }) => fetchPortalDashboard(signal),
    enabled: remoteSessionEnabled(enabled),
    staleTime: DASHBOARD_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    stats: query.data ? mapPortalDashboardStats(query.data.applications) : undefined,
    isLoading: remoteSessionEnabled(enabled) && query.isPending,
  }
}

export function usePortalCalendarQuery(
  month: Date,
  enabled: boolean,
): { events: MypageScheduleEvent[]; isLoading: boolean } {
  const range = portalCalendarRange(month)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.calendar(range.from, range.to),
    queryFn: ({ signal }) => fetchPortalCalendar(range.from, range.to, signal),
    enabled: remoteSessionEnabled(enabled),
    staleTime: CALENDAR_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    events: mapPortalScheduleItems(query.data?.items),
    isLoading: remoteSessionEnabled(enabled) && query.isPending,
  }
}
