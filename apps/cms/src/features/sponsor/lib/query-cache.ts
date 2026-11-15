import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  applyDeletedIdsToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

/** 연도별 기부금 합이 바뀌면 다시 읽어야 하는 예산 카드. 계좌 지급 목록·상세는 포함하지 않는다. */
const SETTLEMENT_BUDGET_SUMMARY_KEY = [
  ...settlementQueryKeys.accountPayments.all(),
  'budgetSummary',
] as const

function sponsorRowId(row: SponsorManagementRow): string {
  return String(row.id ?? '')
}

function discardDeletedQuery(queryClient: QueryClient, queryKey: QueryKey): void {
  void queryClient.cancelQueries({ queryKey })
  const queries = queryClient.getQueryCache().findAll({ queryKey })
  if (queries.some(query => query.getObserversCount() > 0)) return
  queryClient.removeQueries({ queryKey })
}

export function discardDeletedSponsorCaches(queryClient: QueryClient, id: string): void {
  const sponsorId = String(id)
  if (!sponsorId) return
  discardDeletedQuery(queryClient, dataManagementQueryKeys.sponsors.detail(sponsorId))
  discardDeletedQuery(queryClient, dataManagementQueryKeys.sponsors.yearlyBusinesses(sponsorId))
  discardDeletedQuery(queryClient, dataManagementQueryKeys.sponsors.contactsAll(sponsorId))
  discardDeletedQuery(
    queryClient,
    dataManagementQueryKeys.sponsors.programHistoriesAll(sponsorId)
  )
}

export function applyDeletedSponsorsToLists(
  queryClient: QueryClient,
  id: string | readonly string[]
): void {
  const ids = (Array.isArray(id) ? id : [id]).map(String).filter(Boolean)
  applyDeletedIdsToArrayLists(
    queryClient,
    dataManagementQueryKeys.sponsors.listAll(),
    ids,
    sponsorRowId
  )
  applyDeletedIdsToArrayLists(
    queryClient,
    dataManagementQueryKeys.sponsors.options(),
    ids,
    sponsorRowId
  )
  applyDeletedIdsToArrayLists(
    queryClient,
    dataManagementQueryKeys.sponsors.optionsInfiniteAll(),
    ids,
    sponsorRowId
  )
}

/**
 * 연도별 후원금 저장 이후의 파생 조회.
 * 목록 `totalDonationAmount`, 상세의 같은 필드, 계좌 지급 `annualBudgetAmount`는
 * yearly-business 응답이 아니라 각자 GET이 정본이다.
 */
export async function invalidateSponsorDonationAggregateCaches(
  queryClient: QueryClient,
  sponsorId: string
): Promise<void> {
  const id = sponsorId.trim()
  await Promise.all([
    invalidateSponsorListCaches(queryClient),
    id
      ? queryClient.invalidateQueries({
          queryKey: dataManagementQueryKeys.sponsors.detail(id),
        })
      : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: SETTLEMENT_BUDGET_SUMMARY_KEY }),
  ])
}

export async function invalidateSponsorListCaches(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    invalidateArrayLists(queryClient, dataManagementQueryKeys.sponsors.listAll()),
    queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.sponsors.options(),
    }),
    queryClient.invalidateQueries({
      queryKey: dataManagementQueryKeys.sponsors.optionsInfiniteAll(),
    }),
  ])
}

export async function cancelSponsorListQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: dataManagementQueryKeys.sponsors.listAll() }),
    queryClient.cancelQueries({ queryKey: dataManagementQueryKeys.sponsors.options() }),
    queryClient.cancelQueries({
      queryKey: dataManagementQueryKeys.sponsors.optionsInfiniteAll(),
    }),
  ])
}
