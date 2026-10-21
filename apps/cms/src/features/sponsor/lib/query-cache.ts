import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  applyDeletedIdsToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

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
