import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getPortalMe } from '../api/client'

/** Class B + F — 세션 회원. PII는 쿼리 캐시에만 두고 localStorage에 저장하지 않음. */
export function usePortalMeQuery(options?: { enabled?: boolean }) {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = (options?.enabled ?? true) && remote && hasToken

  return useQuery({
    queryKey: platformQueryKeys.auth.me(),
    queryFn: ({ signal }) => getPortalMe(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  })
}
