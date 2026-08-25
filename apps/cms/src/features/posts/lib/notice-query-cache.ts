import type { QueryClient } from '@tanstack/react-query'
import type { Notice } from '@/data/mock/notices'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  statusMatchesListVisibility,
  visibilityFromListQueryKey,
} from '@/features/posts/lib/list-visibility'

function isNoticeListCache(value: unknown): value is Notice[] {
  return Array.isArray(value)
}

function noticeMatchesList(notice: Notice, queryKey: readonly unknown[]): boolean {
  return statusMatchesListVisibility(
    notice.status,
    visibilityFromListQueryKey(queryKey, 'an_vis')
  )
}

export function applyCreatedNoticeToLists(queryClient: QueryClient, created: Notice): void {
  if (!created.id) return
  for (const [queryKey, old] of queryClient.getQueriesData<Notice[]>({
    queryKey: postsQueryKeys.notices.lists(),
  })) {
    if (!isNoticeListCache(old) || !noticeMatchesList(created, queryKey)) continue
    if (old.some(row => row.id === created.id)) continue
    queryClient.setQueryData<Notice[]>(queryKey, [created, ...old])
  }
}

export function applyUpdatedNoticeToLists(queryClient: QueryClient, updated: Notice): void {
  if (!updated.id) return
  for (const [queryKey, old] of queryClient.getQueriesData<Notice[]>({
    queryKey: postsQueryKeys.notices.lists(),
  })) {
    if (!isNoticeListCache(old)) continue
    const matches = noticeMatchesList(updated, queryKey)
    const found = old.some(row => row.id === updated.id)
    if (matches) {
      queryClient.setQueryData<Notice[]>(queryKey, found
        ? old.map(row => (row.id === updated.id ? updated : row))
        : [updated, ...old])
      continue
    }
    if (found) {
      queryClient.setQueryData<Notice[]>(queryKey, old.filter(row => row.id !== updated.id))
    }
  }
}

export function applyDeletedNoticeToLists(queryClient: QueryClient, id: string): void {
  if (!id) return
  queryClient.setQueriesData<Notice[]>({ queryKey: postsQueryKeys.notices.lists() }, old => {
    if (!isNoticeListCache(old)) return old
    return old.filter(row => row.id !== id)
  })
}

export async function invalidateNoticeLists(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: postsQueryKeys.notices.lists() })
}
