import { describe, expect, it } from 'vitest'
import { mapNotificationInboxItem } from './notification-adapters'

describe('mapNotificationInboxItem read state', () => {
  it('readAt이 없으면 미읽음으로 매핑한다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 1,
      title: '제목',
      message: '본문',
      createdAt: '2026-10-27T00:00:00.000Z',
    })
    expect(mapped?.read).toBe(false)
  })

  it('readAt이 있으면 읽음으로 매핑한다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 2,
      title: '제목',
      message: '본문',
      createdAt: '2026-10-27T00:00:00.000Z',
      readAt: '2026-10-27T01:00:00.000Z',
    })
    expect(mapped?.read).toBe(true)
  })
})
