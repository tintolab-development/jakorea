import { useQuery } from '@tanstack/react-query'
import { mapAdminApprovalRequestToRow } from '@/features/user/api/map-admin-approval-request-row'
import {
  memberQueryKeys,
  serializeAdminApprovalRequestParams,
} from '@/features/user/api/member-query-keys'
import { fetchAdminApprovalRequestsPageRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isAdminApprovalRequestsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { ListAdminsParams } from '@/shared/api/generated/members/schemas/listAdminsParams'

const DEFAULT_PAGE_SIZE = 50

export function useAdminApprovalRequestsQuery(
  params: ListAdminsParams = {},
  enabled = true
) {
  const remote = isAdminApprovalRequestsRemoteEnabled()
  const queryParams: ListAdminsParams = {
    page: params.page ?? 0,
    size: params.size ?? DEFAULT_PAGE_SIZE,
    ...params,
  }

  return useQuery({
    queryKey: memberQueryKeys.adminApprovalRequests.list(
      serializeAdminApprovalRequestParams(queryParams)
    ),
    enabled: enabled && remote,
    queryFn: async () => {
      const page = await fetchAdminApprovalRequestsPageRemote(queryParams)
      const rows = (page.items ?? []).map(mapAdminApprovalRequestToRow)
      return {
        rows,
        total: page.totalElements ?? rows.length,
        page: page.page ?? 0,
        totalPages: page.totalPages ?? 1,
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '관리자 권한 신청 목록을 불러오지 못했습니다.'),
    },
  })
}
