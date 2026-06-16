import { useQuery } from '@tanstack/react-query'
import { fetchSettlementsPageRemote } from '@/features/settlement-management/api/settlement-api-client'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { isMemberInstructorSettlementsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'

const PAGE_SIZE = 100

export async function fetchAllInstructorSettlementsRemote(
  instructorMemberId: number
): Promise<SettlementListItemResponse[]> {
  const items: SettlementListItemResponse[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const res = await fetchSettlementsPageRemote({
      instructorMemberId,
      page,
      size: PAGE_SIZE,
    })
    const chunk = res.items ?? []
    items.push(...chunk)
    totalPages = res.totalPages ?? (chunk.length < PAGE_SIZE ? page + 1 : page + 2)
    page += 1
    if (chunk.length === 0) break
  }

  return items
}

export function useMemberInstructorSettlementsQuery(
  instructorMemberId: number | undefined,
  enabled = true
) {
  const remote = isMemberInstructorSettlementsRemoteEnabled()

  return useQuery({
    queryKey: memberQueryKeys.instructorSettlements(instructorMemberId ?? 0),
    enabled: Boolean(enabled && remote && instructorMemberId != null),
    queryFn: () => fetchAllInstructorSettlementsRemote(instructorMemberId!),
  })
}
