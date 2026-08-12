import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getCurrentInstructorRoleRequest } from './client'

/** Class E + F — 내 강사 권한 신청 상태. */
export function useCurrentInstructorRoleRequestQuery(options?: { enabled?: boolean }) {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = (options?.enabled ?? true) && remote && hasToken

  return useQuery({
    queryKey: platformQueryKeys.mypage.instructorRoleRequestCurrent(),
    queryFn: ({ signal }) => getCurrentInstructorRoleRequest(signal),
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: true,
  })
}
