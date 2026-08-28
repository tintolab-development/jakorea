import { useQuery } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { fetchAdminApprovalRequestDetailRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isAdminApprovalRequestsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'

const DETAIL_STALE_MS = 3 * 60 * 1000

export function useAdminApprovalRequestDetailQuery(
  adminAccountId: number | undefined,
  enabled = true
) {
  const remote = isAdminApprovalRequestsRemoteEnabled()

  return useQuery({
    queryKey: memberQueryKeys.adminApprovalRequests.detail(adminAccountId ?? -1),
    enabled: enabled && remote && adminAccountId != null,
    staleTime: DETAIL_STALE_MS,
    queryFn: () => fetchAdminApprovalRequestDetailRemote(adminAccountId as number),
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 권한 신청 상세를 불러오지 못했습니다.'),
    },
  })
}
