import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { parseSponsorSponsorshipStatusFilter } from '@/features/sponsor/model/sponsorship-status'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

export function listStatusFilterFromSearchKey(
  searchParamsKey: string
): 'ALL' | SponsorSponsorshipStatus {
  return parseSponsorSponsorshipStatusFilter(new URLSearchParams(searchParamsKey).get('sp_st'))
}

/** 후원 상태 변경 후 목록 캐시. 현재 필터에 안 맞으면 행을 뺀다. */
export function applySponsorStatusToList(
  rows: SponsorManagementRow[] | undefined,
  sponsorId: string,
  sponsorshipStatus: SponsorSponsorshipStatus,
  listStatusFilter: 'ALL' | SponsorSponsorshipStatus
): SponsorManagementRow[] | undefined {
  if (!rows) return rows
  if (listStatusFilter !== 'ALL' && listStatusFilter !== sponsorshipStatus) {
    return rows.filter(row => row.id !== sponsorId)
  }
  return rows.map(row => (row.id === sponsorId ? { ...row, sponsorshipStatus } : row))
}

function searchKeyFromListQueryKey(queryKey: readonly unknown[]): string {
  const last = queryKey[queryKey.length - 1]
  return typeof last === 'string' ? last : ''
}

function isInfiniteSponsorListCache(
  value: unknown
): value is InfiniteData<DataManagementListPage<SponsorManagementRow>> {
  return (
    value != null &&
    typeof value === 'object' &&
    'pages' in value &&
    Array.isArray((value as InfiniteData<DataManagementListPage<SponsorManagementRow>>).pages)
  )
}

export function applySponsorStatusToCachedLists(
  queryClient: QueryClient,
  sponsorId: string,
  sponsorshipStatus: SponsorSponsorshipStatus
): void {
  for (const [queryKey, old] of queryClient.getQueriesData({
    queryKey: dataManagementQueryKeys.sponsors.listAll(),
  })) {
    const listStatusFilter = listStatusFilterFromSearchKey(searchKeyFromListQueryKey(queryKey))
    if (isInfiniteSponsorListCache(old)) {
      queryClient.setQueryData<InfiniteData<DataManagementListPage<SponsorManagementRow>>>(
        queryKey,
        {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items:
              applySponsorStatusToList(
                page.items,
                sponsorId,
                sponsorshipStatus,
                listStatusFilter
              ) ?? page.items,
          })),
        }
      )
      continue
    }
    if (!Array.isArray(old)) continue
    queryClient.setQueryData(
      queryKey,
      applySponsorStatusToList(old, sponsorId, sponsorshipStatus, listStatusFilter)
    )
  }
}
