import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { shouldUsePlatformContentSeed } from '@/shared/lib/dev-auth'
import { MOCK_TEXTBOOK_CONTENTS } from '../lib/mock-data'
import type { TextbookContent } from '../model/types'
import { fetchPublicTextbooks } from './client'
import { mapPublicTextbookList } from './mappers'

const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000

export const publicTextbooksQueryOptions = queryOptions({
  queryKey: platformQueryKeys.education.textbooks(),
  queryFn: ({ signal }) => fetchPublicTextbooks(signal),
  staleTime: LIST_STALE_MS,
  gcTime: LIST_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
  retryDelay: queryRetryDelay,
})

export function usePublicTextbookCatalog(): {
  items: TextbookContent[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTextbooksQueryOptions,
    enabled: remote,
  })

  const items = useMemo(() => {
    if (!remote || query.isError) {
      return shouldUsePlatformContentSeed() ? [...MOCK_TEXTBOOK_CONTENTS] : []
    }
    if (query.data) return mapPublicTextbookList(query.data.items)
    return shouldUsePlatformContentSeed() ? [...MOCK_TEXTBOOK_CONTENTS] : []
  }, [query.data, query.isError, remote])

  return {
    items,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}
