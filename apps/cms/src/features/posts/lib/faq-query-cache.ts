import type { QueryClient } from '@tanstack/react-query'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  statusMatchesListVisibility,
  visibilityFromListQueryKey,
} from '@/features/posts/lib/list-visibility'

function isFaqListCache(value: unknown): value is AdminFaq[] {
  return Array.isArray(value)
}

function faqMatchesList(faq: AdminFaq, queryKey: readonly unknown[]): boolean {
  return statusMatchesListVisibility(
    faq.status,
    visibilityFromListQueryKey(queryKey, 'af_vis')
  )
}

export function applyCreatedFaqToLists(queryClient: QueryClient, created: AdminFaq): void {
  if (!created.id) return
  for (const [queryKey, old] of queryClient.getQueriesData<AdminFaq[]>({
    queryKey: postsQueryKeys.faqs.lists(),
  })) {
    if (!isFaqListCache(old) || !faqMatchesList(created, queryKey)) continue
    if (old.some(row => row.id === created.id)) continue
    queryClient.setQueryData<AdminFaq[]>(queryKey, [created, ...old])
  }
}

export function applyUpdatedFaqToLists(queryClient: QueryClient, updated: AdminFaq): void {
  if (!updated.id) return
  for (const [queryKey, old] of queryClient.getQueriesData<AdminFaq[]>({
    queryKey: postsQueryKeys.faqs.lists(),
  })) {
    if (!isFaqListCache(old)) continue
    const matches = faqMatchesList(updated, queryKey)
    const found = old.some(row => row.id === updated.id)
    if (matches) {
      queryClient.setQueryData<AdminFaq[]>(queryKey, found
        ? old.map(row => (row.id === updated.id ? updated : row))
        : [updated, ...old])
      continue
    }
    if (found) {
      queryClient.setQueryData<AdminFaq[]>(queryKey, old.filter(row => row.id !== updated.id))
    }
  }
}

export function applyDeletedFaqToLists(queryClient: QueryClient, id: string): void {
  if (!id) return
  queryClient.setQueriesData<AdminFaq[]>({ queryKey: postsQueryKeys.faqs.lists() }, old => {
    if (!isFaqListCache(old)) return old
    return old.filter(row => row.id !== id)
  })
}

export async function invalidateFaqLists(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: postsQueryKeys.faqs.lists() })
}
