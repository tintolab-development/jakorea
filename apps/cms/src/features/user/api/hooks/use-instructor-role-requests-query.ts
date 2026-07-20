import { useQuery } from '@tanstack/react-query'
import { mapInstructorRoleRequestToRow } from '@/features/user/api/map-instructor-role-request-row'
import {
  memberQueryKeys,
  serializeInstructorRoleRequestParams,
} from '@/features/user/api/member-query-keys'
import { fetchInstructorRoleRequestsPageRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { isInstructorRoleRequestsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { ListInstructorRoleRequestsParams } from '@/shared/api/generated/members/schemas'

const DEFAULT_PAGE_SIZE = 50

export function useInstructorRoleRequestsQuery(
  params: ListInstructorRoleRequestsParams = {},
  enabled = true
) {
  const remote = isInstructorRoleRequestsRemoteEnabled()
  const queryParams: ListInstructorRoleRequestsParams = {
    page: params.page ?? 0,
    size: params.size ?? DEFAULT_PAGE_SIZE,
    ...params,
  }

  return useQuery({
    queryKey: memberQueryKeys.instructorRoleRequests.list(
      serializeInstructorRoleRequestParams(queryParams)
    ),
    enabled: enabled && remote,
    queryFn: async () => {
      const page = await fetchInstructorRoleRequestsPageRemote(queryParams)
      const rows = (page.items ?? []).map(mapInstructorRoleRequestToRow)
      return {
        rows,
        total: page.totalElements ?? rows.length,
        page: page.page ?? 0,
        totalPages: page.totalPages ?? 1,
      }
    },
    meta: {
      errorMessage: (error: unknown) =>
        getMemberApiErrorMessage(error, '강사 권한 신청 목록을 불러오지 못했습니다.'),
    },
  })
}
