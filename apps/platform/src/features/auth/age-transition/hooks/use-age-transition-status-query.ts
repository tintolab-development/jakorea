import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAgeTransitionStatus } from '../api/client'

/** Class F — 로그인 회원 AGE14 전환 상태. 완료 가드용으로 staleTime 0. */
export function useAgeTransitionStatusQuery(options?: { enabled?: boolean }) {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = (options?.enabled ?? true) && remote && hasToken

  return useQuery({
    queryKey: platformQueryKeys.auth.ageTransition(),
    queryFn: ({ signal }) => getAgeTransitionStatus(signal),
    enabled,
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
