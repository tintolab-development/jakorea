import { useQuery } from '@tanstack/react-query'
import { adminMeQueryKeys } from './admin-me-query-keys'
import { fetchAdminMeProfile } from './admin-me-service'

const PROFILE_STALE_MS = 60_000
const PROFILE_GC_MS = 10 * 60_000

export function useAdminMeProfile(adminId: string | undefined, enabled: boolean) {
  const id = adminId ?? ''
  return useQuery({
    queryKey: adminMeQueryKeys.profile(id),
    queryFn: fetchAdminMeProfile,
    enabled: Boolean(enabled && id),
    staleTime: PROFILE_STALE_MS,
    gcTime: PROFILE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}
