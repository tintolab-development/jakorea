import type { QueryClient } from '@tanstack/react-query'
import type { AdminFaq } from '@/features/posts/model/admin-faq'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import {
  statusMatchesListVisibility,
  visibilityFromListQueryKey,
} from '@/features/posts/lib/list-visibility'
import {
  applyCreatedToMatchingArrayLists,
  applyDeletedIdsToArrayLists,
  applyUpdatedToMatchingArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function faqRowId(faq: AdminFaq): string {
  return String(faq.id ?? '')
}

function faqMatchesList(queryKey: readonly unknown[], faq: AdminFaq): boolean {
  return statusMatchesListVisibility(
    faq.status,
    visibilityFromListQueryKey(queryKey, 'af_vis')
  )
}

export function applyCreatedFaqToLists(queryClient: QueryClient, created: AdminFaq): void {
  applyCreatedToMatchingArrayLists(
    queryClient,
    postsQueryKeys.faqs.lists(),
    created,
    faqRowId,
    faqMatchesList
  )
}

export function applyUpdatedFaqToLists(queryClient: QueryClient, updated: AdminFaq): void {
  applyUpdatedToMatchingArrayLists(
    queryClient,
    postsQueryKeys.faqs.lists(),
    updated,
    faqRowId,
    faqMatchesList
  )
}

export function applyDeletedFaqToLists(
  queryClient: QueryClient,
  id: string | readonly string[]
): void {
  const ids = (Array.isArray(id) ? id : [id]).map(String)
  applyDeletedIdsToArrayLists(queryClient, postsQueryKeys.faqs.lists(), ids, faqRowId)
}

export async function invalidateFaqLists(queryClient: QueryClient): Promise<void> {
  await invalidateArrayLists(queryClient, postsQueryKeys.faqs.lists())
}
