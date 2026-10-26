import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { NOTIFICATION_CATEGORY_ALL } from '../model/categories'
import {
  fetchMyNotificationUnreadCount,
  fetchMyNotifications,
  markMyNotificationClicked,
  type MemberNotificationPageResponse,
} from './client'

const PAGE_SIZE = 20
const LIST_STALE_MS = 30_000
const UNREAD_COUNT_STALE_MS = 30_000
const GC_MS = 10 * 60_000

function remoteSessionEnabled(enabled: boolean): boolean {
  return enabled && isRemoteApiConfigured() && Boolean(getAccessToken())
}

export function useMyNotificationsInfiniteQuery(category: string, enabled: boolean) {
  const queryEnabled = remoteSessionEnabled(enabled)
  const query = useInfiniteQuery({
    queryKey: platformQueryKeys.notification.list({ category, size: PAGE_SIZE }),
    queryFn: ({ pageParam, signal }) =>
      fetchMyNotifications(
        {
          page: pageParam,
          size: PAGE_SIZE,
          category: category === NOTIFICATION_CATEGORY_ALL ? undefined : category,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const page = lastPage.page ?? 0
      const totalPages = lastPage.totalPages ?? 0
      return page + 1 < totalPages ? page + 1 : undefined
    },
    enabled: queryEnabled,
    staleTime: LIST_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    items: query.data?.pages.flatMap(page => page.items ?? []) ?? [],
    isLoading: queryEnabled && query.isPending,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

/** 헤더 알림 아이콘 활성 여부 — 로그인 회원 scope, 포커스 복귀 시 재조회 */
export function useMyNotificationUnreadCountQuery(enabled: boolean): number {
  const query = useQuery({
    queryKey: platformQueryKeys.notification.unreadCount(),
    queryFn: ({ signal }) => fetchMyNotificationUnreadCount(signal),
    enabled: remoteSessionEnabled(enabled),
    staleTime: UNREAD_COUNT_STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return query.data ?? 0
}

export function useMarkMyNotificationClickedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipientId: number) => markMyNotificationClicked(recipientId),
    onSuccess: (_data, recipientId) => {
      const readAt = new Date().toISOString()
      queryClient.setQueriesData<InfiniteData<MemberNotificationPageResponse>>(
        { queryKey: platformQueryKeys.notification.listPrefix() },
        data =>
          data && {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              items: page.items?.map(item =>
                item.recipientId === recipientId && !item.readAt ? { ...item, readAt } : item,
              ),
            })),
          },
      )
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.notification.all() })
    },
  })
}
