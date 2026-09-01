import type { QueryClient } from '@tanstack/react-query'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import type { AdminInquiryRow } from '@/features/posts/model/admin-inquiry-management.types'
import {
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
  invalidateArrayLists,
} from '@/shared/lib/query-list-cache'

function inquiryId(row: AdminInquiryRow): string {
  return row.id
}

export function applyUpdatedInquiryToLists(
  queryClient: QueryClient,
  updated: AdminInquiryRow
): void {
  applyUpdatedToArrayLists(queryClient, postsQueryKeys.inquiries.lists(), updated, inquiryId)
}

export function applyDeletedInquiryToLists(queryClient: QueryClient, id: string): void {
  applyDeletedToArrayLists(queryClient, postsQueryKeys.inquiries.lists(), id, inquiryId)
}

export function removeInquiryDetailQueries(queryClient: QueryClient, id: string): void {
  if (!id) return
  queryClient.removeQueries({ queryKey: postsQueryKeys.inquiries.detail(id) })
  queryClient.removeQueries({ queryKey: postsQueryKeys.inquiries.answers(id) })
}

export async function invalidateInquiryLists(queryClient: QueryClient): Promise<void> {
  await invalidateArrayLists(queryClient, postsQueryKeys.inquiries.lists())
}
