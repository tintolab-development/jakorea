import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import {
  fetchAllPaymentStatementsRemote,
  fetchSettlementsPageRemote,
} from '@/features/settlement-management/api/settlement-api-client'
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

const SETTLEMENT_SUBRESOURCE_STALE_MS = 30_000

export function instructorSettlementsQueryOptions(instructorMemberId: number) {
  return queryOptions({
    queryKey: memberQueryKeys.instructorSettlements(instructorMemberId),
    staleTime: SETTLEMENT_SUBRESOURCE_STALE_MS,
    queryFn: () => fetchAllInstructorSettlementsRemote(instructorMemberId),
  })
}

export function fetchInstructorSettlementsQuery(
  queryClient: QueryClient,
  instructorMemberId: number
) {
  return queryClient.ensureQueryData(instructorSettlementsQueryOptions(instructorMemberId))
}

/**
 * 지급조서 ID join — BE에 instructorMemberId 스코프 API가 없어 전역 statements를 쓴다.
 * staleTime + ensureQueryData로 탭 재진입 시 과호출을 막는다.
 */
export function instructorSettlementStatementJoinQueryOptions(instructorMemberId: number) {
  return queryOptions({
    queryKey: memberQueryKeys.instructorSettlementStatementJoin(instructorMemberId),
    staleTime: SETTLEMENT_SUBRESOURCE_STALE_MS,
    queryFn: async (): Promise<Map<number, number>> => {
      const statements = await fetchAllPaymentStatementsRemote()
      const map = new Map<number, number>()
      for (const statement of statements) {
        if (statement.settlementId != null && statement.statementId != null) {
          map.set(statement.settlementId, statement.statementId)
        }
      }
      return map
    },
  })
}

export function fetchInstructorSettlementStatementJoinQuery(
  queryClient: QueryClient,
  instructorMemberId: number
) {
  return queryClient.ensureQueryData(
    instructorSettlementStatementJoinQueryOptions(instructorMemberId)
  )
}

export function useMemberInstructorSettlementsQuery(
  instructorMemberId: number | undefined,
  enabled = true,
  options?: { manualFetch?: boolean }
) {
  const remote = isMemberInstructorSettlementsRemoteEnabled()

  return useQuery({
    ...instructorSettlementsQueryOptions(instructorMemberId ?? 0),
    enabled: options?.manualFetch
      ? false
      : Boolean(enabled && remote && instructorMemberId != null),
  })
}

export function useInstructorSettlementStatementJoinQuery(
  instructorMemberId: number | undefined,
  enabled = true,
  options?: { manualFetch?: boolean }
) {
  const remote = isMemberInstructorSettlementsRemoteEnabled()

  return useQuery({
    ...instructorSettlementStatementJoinQueryOptions(instructorMemberId ?? 0),
    enabled: options?.manualFetch
      ? false
      : Boolean(enabled && remote && instructorMemberId != null),
  })
}
