import { describe, expect, it } from 'vitest'
import type { Notification } from '@/features/dashboard/api/notification-service'
import { mergeAdminNotificationInbox } from './merge-admin-notification-inbox'

function row(partial: Partial<Notification> & Pick<Notification, 'id' | 'read'>): Notification {
  return {
    type: 'system',
    title: '알림',
    body: '본문',
    createdAt: '2026-10-27T00:00:00.000Z',
    ...partial,
  }
}

describe('mergeAdminNotificationInbox', () => {
  it('keeps unread rows even when the mixed inbox page only has read items', () => {
    const merged = mergeAdminNotificationInbox(
      [row({ id: 'u1', read: false, body: '미읽음' })],
      [row({ id: 'r1', read: true, body: '읽음' })]
    )
    expect(merged.map(item => item.id)).toEqual(['r1', 'u1'])
    expect(merged.find(item => item.id === 'u1')?.read).toBe(false)
  })

  it('prefers the unread copy when the same id appears in both lists', () => {
    const merged = mergeAdminNotificationInbox(
      [row({ id: 'n1', read: false })],
      [row({ id: 'n1', read: true })]
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.read).toBe(false)
  })
})
