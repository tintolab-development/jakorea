import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
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
  markMyNotificationRead,
  markMyNotificationsReadAll,
} from './client'

const PAGE_SIZE = 20
const LIST_STALE_MS = 30_000
const UNREAD_COUNT_STALE_MS = 30_000
const GC_MS = 10 * 60_000

function remoteSessionEnabled(enabled: boolean): boolean {
  return enabled && isRemoteApiConfigured() && Boolean(getAccessToken())
}

export function useMyNotificationsInfiniteQuery(
  category: string,
  enabled: boolean,
  unreadOnly = false,
) {
  const queryEnabled = remoteSessionEnabled(enabled)
  const categoryParam = category === NOTIFICATION_CATEGORY_ALL ? undefined : category
  const query = useInfiniteQuery({
    queryKey: platformQueryKeys.notification.list({
      page: 0,
      size: PAGE_SIZE,
      unreadOnly,
      category: categoryParam,
    }),
    queryFn: ({ pageParam, signal }) =>
      fetchMyNotifications(
        {
          page: pageParam,
          size: PAGE_SIZE,
          category: categoryParam,
          unreadOnly: unreadOnly || undefined,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const page = lastPage.page
      const totalPages = lastPage.totalPages
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
    items: query.data?.pages.flatMap(page => page.items) ?? [],
    isLoading: queryEnabled && query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  }
}

/** 헤더 알림 아이콘 활성 여부 — 로그인 회원 scope, 포커스 복귀 시 재조회 */
export function useMyNotificationUnreadCountQuery(enabled: boolean, category?: string): number {
  const query = useQuery({
    queryKey: platformQueryKeys.notification.unreadCount(category),
    queryFn: ({ signal }) => fetchMyNotificationUnreadCount(category, signal),
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

async function syncNotificationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.notification.listPrefix() }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.notification.unreadCountPrefix() }),
  ])
}

export function useMarkMyNotificationClickedMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipientId: number) => markMyNotificationClicked(recipientId),
    onSuccess: () => syncNotificationQueries(queryClient),
  })
}

export function useMarkMyNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipientId: number) => markMyNotificationRead(recipientId),
    onSuccess: () => syncNotificationQueries(queryClient),
  })
}

export function useMarkMyNotificationsReadAllMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markMyNotificationsReadAll(),
    onSuccess: () => syncNotificationQueries(queryClient),
  })
}
