import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { getAdminNotificationInboxPage } from '@/features/dashboard/api/admin-dashboard-service'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'
import {
  ADMIN_NOTIFICATION_INBOX_PAGE_SIZE,
  nextAdminNotificationPageParam,
} from '@/features/dashboard/lib/admin-notification-inbox-page'
import { mergeAdminNotificationInbox } from '@/features/dashboard/lib/merge-admin-notification-inbox'

function useAdminNotificationInboxQuery(
  enabled: boolean,
  unreadOnly: boolean,
  category: string | undefined
) {
  // 탭(category)마다 키를 나눠 캐시·무한 스크롤을 따로 이어 간다. 전체는 기존 키 그대로.
  const params = {
    size: ADMIN_NOTIFICATION_INBOX_PAGE_SIZE,
    unreadOnly,
    ...(category ? { category } : {}),
  }
  return useInfiniteQuery({
    queryKey: dashboardQueryKeys.notifications('remote', params),
    queryFn: ({ pageParam }) =>
      getAdminNotificationInboxPage({
        page: pageParam,
        size: params.size,
        unreadOnly: params.unreadOnly,
        category,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => nextAdminNotificationPageParam(lastPage),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

/** @param category BE notificationCategory. 생략하면 전체 목록 */
export function useAdminNotifications(enabled = true, category?: string) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)
  const unreadQuery = useAdminNotificationInboxQuery(remoteEnabled, true, category)
  const inboxQuery = useAdminNotificationInboxQuery(remoteEnabled, false, category)

  const unreadNotifications = useMemo(
    () => unreadQuery.data?.pages.flatMap(page => page.items) ?? [],
    [unreadQuery.data?.pages]
  )
  const inboxNotifications = useMemo(
    () => inboxQuery.data?.pages.flatMap(page => page.items) ?? [],
    [inboxQuery.data?.pages]
  )
  const notifications = useMemo(
    () => mergeAdminNotificationInbox(unreadNotifications, inboxNotifications),
    [inboxNotifications, unreadNotifications]
  )

  const fetchNextPage = useCallback(async () => {
    if (unreadQuery.hasNextPage) {
      await unreadQuery.fetchNextPage()
      return
    }
    if (inboxQuery.hasNextPage) {
      await inboxQuery.fetchNextPage()
    }
  }, [inboxQuery, unreadQuery])

  const refetch = useCallback(async () => {
    await Promise.all([unreadQuery.refetch(), inboxQuery.refetch()])
  }, [inboxQuery, unreadQuery])

  return {
    notifications,
    isLoading: unreadQuery.isLoading || inboxQuery.isLoading,
    hasNextPage: Boolean(unreadQuery.hasNextPage || inboxQuery.hasNextPage),
    isFetchingNextPage: unreadQuery.isFetchingNextPage || inboxQuery.isFetchingNextPage,
    fetchNextPage,
    refetch,
  }
}
