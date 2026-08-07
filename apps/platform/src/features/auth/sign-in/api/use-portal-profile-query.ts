import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getPortalProfile } from './client'

/** Class B + F — 내정보(교사/강사 플래그). */
export function usePortalProfileQuery(options?: { enabled?: boolean }) {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = (options?.enabled ?? true) && remote && hasToken

  return useQuery({
    queryKey: platformQueryKeys.auth.memberProfile(),
    queryFn: ({ signal }) => getPortalProfile(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}
