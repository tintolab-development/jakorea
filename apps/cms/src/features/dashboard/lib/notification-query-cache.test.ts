import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import type { Notification } from '@/features/dashboard/api/notification-service'
import {
  applyAllNotificationsRead,
  applyNotificationHidden,
  applyNotificationRead,
} from './notification-query-cache'

function notification(
  partial: Partial<Notification> & Pick<Notification, 'id' | 'read'>
): Notification {
  return {
    type: 'system',
    title: '알림',
    body: '본문',
    createdAt: '2026-08-24T00:00:00.000Z',
    ...partial,
  }
}

describe('notification-query-cache', () => {
  const inboxKey = dashboardQueryKeys.notifications('remote', {})
  const unreadKey = dashboardQueryKeys.notifications('remote', { unreadOnly: true })
  const countKey = dashboardQueryKeys.notificationCount('remote')

  it('marks a notification read and decrements unread count', () => {
    const queryClient = new QueryClient()
    const unread = notification({ id: 'n1', read: false })
    queryClient.setQueryData<Notification[]>(inboxKey, [unread])
    queryClient.setQueryData<Notification[]>(unreadKey, [unread])
    queryClient.setQueryData<number>(countKey, 2)

    applyNotificationRead(queryClient, 'n1')

    expect(queryClient.getQueryData<Notification[]>(inboxKey)?.[0]?.read).toBe(true)
    expect(queryClient.getQueryData<Notification[]>(unreadKey)).toEqual([])
    expect(queryClient.getQueryData<number>(countKey)).toBe(1)
  })

  it('hides a notification and decrements unread count when it was unread', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Notification[]>(inboxKey, [
      notification({ id: 'n1', read: false }),
      notification({ id: 'n2', read: true }),
    ])
    queryClient.setQueryData<number>(countKey, 1)

    applyNotificationHidden(queryClient, 'n1')

    expect(queryClient.getQueryData<Notification[]>(inboxKey)?.map(row => row.id)).toEqual(['n2'])
    expect(queryClient.getQueryData<number>(countKey)).toBe(0)
  })

  it('marks all notifications read and zeroes unread count', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Notification[]>(inboxKey, [
      notification({ id: 'n1', read: false }),
      notification({ id: 'n2', read: true }),
    ])
    queryClient.setQueryData<Notification[]>(unreadKey, [notification({ id: 'n1', read: false })])
    queryClient.setQueryData<number>(countKey, 4)

    applyAllNotificationsRead(queryClient)

    expect(queryClient.getQueryData<Notification[]>(inboxKey)?.every(row => row.read)).toBe(true)
    expect(queryClient.getQueryData<Notification[]>(unreadKey)).toEqual([])
    expect(queryClient.getQueryData<number>(countKey)).toBe(0)
  })
})
