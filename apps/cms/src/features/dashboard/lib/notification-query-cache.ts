import type { QueryClient } from '@tanstack/react-query'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import type { Notification } from '@/features/dashboard/api/notification-service'

function isNotificationList(value: unknown): value is Notification[] {
  return Array.isArray(value)
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

export function applyNotificationRead(queryClient: QueryClient, id: string): void {
  let unreadDelta = 0
  for (const [queryKey, old] of queryClient.getQueriesData<Notification[]>({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    if (!isNotificationList(old)) continue
    const target = old.find(row => row.id === id)
    if (!target || target.read) continue
    unreadDelta = -1
    if (isUnreadOnlyKey(queryKey)) {
      queryClient.setQueryData<Notification[]>(
        queryKey,
        old.filter(row => row.id !== id)
      )
      continue
    }
    queryClient.setQueryData<Notification[]>(
      queryKey,
      old.map(row => (row.id === id ? { ...row, read: true } : row))
    )
  }
  if (unreadDelta !== 0) bumpUnreadCount(queryClient, unreadDelta)
}

export function applyNotificationHidden(queryClient: QueryClient, id: string): void {
  let unreadDelta = 0
  for (const [queryKey, old] of queryClient.getQueriesData<Notification[]>({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    if (!isNotificationList(old)) continue
    const target = old.find(row => row.id === id)
    if (!target) continue
    if (!target.read) unreadDelta = -1
    queryClient.setQueryData<Notification[]>(
      queryKey,
      old.filter(row => row.id !== id)
    )
  }
  if (unreadDelta !== 0) bumpUnreadCount(queryClient, unreadDelta)
}

export function applyAllNotificationsRead(queryClient: QueryClient): void {
  for (const [queryKey, old] of queryClient.getQueriesData<Notification[]>({
    queryKey: dashboardQueryKeys.notificationsAll('remote'),
  })) {
    if (!isNotificationList(old)) continue
    if (isUnreadOnlyKey(queryKey)) {
      queryClient.setQueryData<Notification[]>(queryKey, [])
      continue
    }
    queryClient.setQueryData<Notification[]>(
      queryKey,
      old.map(row => (row.read ? row : { ...row, read: true }))
    )
  }
  queryClient.setQueryData<number>(dashboardQueryKeys.notificationCount('remote'), 0)
}
