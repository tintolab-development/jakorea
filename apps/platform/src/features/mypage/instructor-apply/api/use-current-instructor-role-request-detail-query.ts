import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getCurrentInstructorRoleRequestDetail } from './client'

/** Class D — 내 강사 권한 신청 제출 스냅샷 (승인 대기 읽기 전용). */
export function useCurrentInstructorRoleRequestDetailQuery(options?: {
  enabled?: boolean
}) {
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const enabled = (options?.enabled ?? true) && remote && hasToken

  return useQuery({
    queryKey: platformQueryKeys.mypage.instructorRoleRequestCurrentDetail(),
    queryFn: ({ signal }) => getCurrentInstructorRoleRequestDetail(signal),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
