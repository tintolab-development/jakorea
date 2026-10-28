import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import type { Notification } from '@/features/dashboard/api/notification-service'
import type { AdminNotificationInboxPage } from '@/features/dashboard/lib/admin-notification-inbox-page'

function isNotificationList(value: unknown): value is Notification[] {
  return Array.isArray(value)
}

function isInfiniteInbox(value: unknown): value is InfiniteData<AdminNotificationInboxPage> {
  if (value == null || typeof value !== 'object' || !('pages' in value)) return false
  return Array.isArray((value as InfiniteData<AdminNotificationInboxPage>).pages)
}

function isUnreadOnlyKey(queryKey: readonly unknown[]): boolean {
  const last = queryKey[queryKey.length - 1]
  return (
    typeof last === 'object' &&
    last != null &&
    'unreadOnly' in last &&
    (last as { unreadOnly?: unknown }).unreadOnly === true
  )
}

function bumpUnreadCount(queryClient: QueryClient, delta: number): void {
  const key = dashboardQueryKeys.notificationCount('remote')
  queryClient.setQueryData<number>(key, old => {
    if (typeof old !== 'number') return old
    return Math.max(0, old + delta)
  })
}

function findNotification(old: unknown, id: string): Notification | undefined {
  if (isNotificationList(old)) return old.find(row => row.id === id)
  if (isInfiniteInbox(old)) {
    for (const page of old.pages) {
      const match = page.items.find(row => row.id === id)
      if (match) return match
    }
  }
  return undefined
}

function mapInboxCache(
  old: unknown,
  mapItems: (items: Notification[]) => Notification[]
): unknown {
  if (isNotificationList(old)) return mapItems(old)
  if (isInfiniteInbox(old)) {
    return {
      ...old,
      pages: old.pages.map(page => ({
        ...page,
        items: mapItems(page.items),
      })),
    }
  }
  return old
}

export function applyNotificationRead(queryClient: QueryClient, id: string): void {
  let unreadDelta = 0
  for (const [queryKey, old] of queryClient.getQueriesData({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    const target = findNotification(old, id)
    if (!target || target.read) continue
    unreadDelta = -1
    queryClient.setQueryData(
      queryKey,
      mapInboxCache(old, items =>
        isUnreadOnlyKey(queryKey)
          ? items.filter(row => row.id !== id)
          : items.map(row => (row.id === id ? { ...row, read: true } : row))
      )
    )
  }
  if (unreadDelta !== 0) bumpUnreadCount(queryClient, unreadDelta)
}

export function applyNotificationHidden(queryClient: QueryClient, id: string): void {
  let unreadDelta = 0
  for (const [queryKey, old] of queryClient.getQueriesData({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    const target = findNotification(old, id)
    if (!target) continue
    if (!target.read) unreadDelta = -1
    queryClient.setQueryData(
      queryKey,
      mapInboxCache(old, items => items.filter(row => row.id !== id))
    )
  }
  if (unreadDelta !== 0) bumpUnreadCount(queryClient, unreadDelta)
}

export function applyAllNotificationsRead(queryClient: QueryClient): void {
  for (const [queryKey, old] of queryClient.getQueriesData({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    queryClient.setQueryData(
      queryKey,
      mapInboxCache(old, items =>
        isUnreadOnlyKey(queryKey)
          ? []
          : items.map(row => (row.read ? row : { ...row, read: true }))
      )
    )
  }
  queryClient.setQueryData<number>(dashboardQueryKeys.notificationCount('remote'), 0)
}
