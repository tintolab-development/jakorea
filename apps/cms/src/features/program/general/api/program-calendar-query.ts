import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  fetchAdminProgramCalendarRemote,
  type AdminProgramCalendarQuery,
} from './program-calendar-api-client'
import { programCalendarQueryKeys } from './program-calendar-query-keys'

const PROGRAM_CALENDAR_STALE_MS = 30_000

export function adminProgramCalendarQueryOptions(params: AdminProgramCalendarQuery) {
  return queryOptions({
    queryKey: programCalendarQueryKeys.list(params),
    queryFn: () => fetchAdminProgramCalendarRemote(params),
    staleTime: PROGRAM_CALENDAR_STALE_MS,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useAdminProgramCalendarQuery(
  params: AdminProgramCalendarQuery | null,
  enabled = true
) {
  const remoteEnabled = enabled && shouldUseProgramsHttpRemoteApi() && params != null
  return useQuery({
    queryKey: params
      ? programCalendarQueryKeys.list(params)
      : ([...programCalendarQueryKeys.all, 'disabled'] as const),
    queryFn: () => fetchAdminProgramCalendarRemote(params as AdminProgramCalendarQuery),
    staleTime: PROGRAM_CALENDAR_STALE_MS,
    gcTime: 10 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
    enabled: remoteEnabled,
  })
}
