import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSponsorSelectOptionsPage } from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'

export const SPONSOR_SELECT_SEARCH_DEBOUNCE_MS = 300

export function useSponsorSelectOptionsInfinite(enabled = true) {
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled)
  const [searchDraft, setSearchDraft] = useState('')
  const debouncedKeyword = useDebouncedValue(searchDraft, SPONSOR_SELECT_SEARCH_DEBOUNCE_MS)

  const query = useInfiniteQuery({
    queryKey: dataManagementQueryKeys.sponsors.optionsInfinite(debouncedKeyword),
    queryFn: ({ pageParam }) => getSponsorSelectOptionsPage(debouncedKeyword, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const nextPage = lastPageParam + 1
      if (nextPage >= lastPage.totalPages) return undefined
      return nextPage
    },
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: 1,
  })

  const options = useMemo(
    () =>
      (query.data?.pages.flatMap(page => page.items) ?? []).map(row => ({
        value: String(row.id),
        label: row.name,
      })),
    [query.data]
  )

  return {
    ...query,
    options,
    searchDraft,
    setSearchDraft,
    debouncedKeyword,
  }
}
