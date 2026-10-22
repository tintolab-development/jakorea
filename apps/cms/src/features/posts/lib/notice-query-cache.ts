import type { QueryClient } from '@tanstack/react-query'
import type { Notice } from '@/features/posts/model/notice'
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

function noticeRowId(notice: Notice): string {
  return String(notice.id ?? '')
}

function noticeMatchesList(
  queryKey: readonly unknown[],
  notice: Notice
): boolean {
  return statusMatchesListVisibility(
    notice.status,
    visibilityFromListQueryKey(queryKey, 'an_vis')
  )
}

export function applyCreatedNoticeToLists(queryClient: QueryClient, created: Notice): void {
  applyCreatedToMatchingArrayLists(
    queryClient,
    postsQueryKeys.notices.lists(),
    created,
    noticeRowId,
    noticeMatchesList
  )
}

export function applyUpdatedNoticeToLists(queryClient: QueryClient, updated: Notice): void {
  applyUpdatedToMatchingArrayLists(
    queryClient,
    postsQueryKeys.notices.lists(),
    updated,
    noticeRowId,
    noticeMatchesList
  )
}

/**
 * 공지 저장 응답은 첨부 메타데이터를 포함하지 않을 수 있으므로
 * 상세 캐시를 서버 응답 기준으로 다시 hydrate한다.
 */
export async function invalidateNoticeDetail(
  queryClient: QueryClient,
  noticeId: string
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: postsQueryKeys.notices.detail(noticeId),
    exact: true,
  })
}

export function applyDeletedNoticeToLists(
  queryClient: QueryClient,
  id: string | readonly string[]
): void {
  const ids = (Array.isArray(id) ? id : [id]).map(String)
  applyDeletedIdsToArrayLists(queryClient, postsQueryKeys.notices.lists(), ids, noticeRowId)
}

export async function invalidateNoticeLists(queryClient: QueryClient): Promise<void> {
  await invalidateArrayLists(queryClient, postsQueryKeys.notices.lists())
}
