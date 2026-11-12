import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchMypageProgramStatsFromApplications } from '../../education/applications/api/program-application-stats'
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

/** GET /api/portal/me/dashboard.applications (보조·로깅용) */
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
    refetchOnMount: 'always',
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

/**
 * 나의 홈 프로그램 통계 카드 — USER-FUNC-0237.
 * 신청 목록 displayStatus 집계가 현황 탭·강의현황 탭과 일치하도록 목록 API를 정본으로 쓴다.
 */
export function useMypageHomeProgramStats(enabled: boolean): {
  stats: MypageProgramStats | undefined
  isLoading: boolean
} {
  const remote = remoteSessionEnabled(enabled)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplicationStats(),
    queryFn: ({ signal }) => fetchMypageProgramStatsFromApplications(signal),
    enabled: remote,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: GC_MS,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    stats: query.data,
    isLoading: remote && query.isPending && !query.data,
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
