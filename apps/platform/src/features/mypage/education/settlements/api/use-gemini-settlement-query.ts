import { useQuery } from '@tanstack/react-query'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  fetchGeminiLectureSchedules,
  fetchGeminiSettlementSummary,
} from './gemini-settlement-client'
import { mapGeminiLectureSchedulesToSettlementItems } from '../lib/map-gemini-lecture-schedules'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function queryOptions() {
  return {
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

export function useGeminiSettlementTabQuery(
  applicationType: ProgramApplicationType | string | null | undefined,
  applicationId: string | null | undefined,
  enabled: boolean,
) {
  const type = (applicationType ?? '').trim().toUpperCase()
  const id = (applicationId ?? '').trim()
  const remoteEnabled = Boolean(
    enabled &&
      isRemoteApiConfigured() &&
      getAccessToken() &&
      type &&
      id &&
      Number.isFinite(Number(id)) &&
      Number(id) > 0,
  )

  const summary = useQuery({
    queryKey: platformQueryKeys.mypage.geminiSettlementSummary(type, id),
    queryFn: ({ signal }) => fetchGeminiSettlementSummary(type, id, signal),
    enabled: remoteEnabled,
    ...queryOptions(),
  })
  const schedules = useQuery({
    queryKey: platformQueryKeys.mypage.geminiLectureSchedules(type, id),
    queryFn: ({ signal }) => fetchGeminiLectureSchedules(type, id, signal),
    enabled: remoteEnabled,
    ...queryOptions(),
  })

  const isLoading = remoteEnabled && (summary.isPending || schedules.isPending)
  const isError = remoteEnabled && (summary.isError || schedules.isError)
  const items = mapGeminiLectureSchedulesToSettlementItems(schedules.data ?? [])

  return {
    enabled: remoteEnabled,
    isLoading,
    isError,
    isRefetching: summary.isRefetching || schedules.isRefetching,
    summary: summary.data,
    items,
    scheduleItems: schedules.data ?? [],
    refetch: () => {
      void summary.refetch()
      void schedules.refetch()
    },
  }
}
