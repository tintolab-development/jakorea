import { useQuery } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { fetchInstructorRoleRequestDetailRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isInstructorRoleRequestsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'

const DETAIL_STALE_MS = 3 * 60 * 1000

export function useInstructorRoleRequestDetailQuery(
  requestId: number | undefined,
  enabled = true
) {
  const remote = isInstructorRoleRequestsRemoteEnabled()

  return useQuery({
    queryKey: memberQueryKeys.instructorRoleRequests.detail(requestId ?? -1),
    enabled: enabled && remote && requestId != null,
    staleTime: DETAIL_STALE_MS,
    queryFn: () => fetchInstructorRoleRequestDetailRemote(requestId as number),
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '강사 권한 신청 상세를 불러오지 못했습니다.'),
    },
  })
}
