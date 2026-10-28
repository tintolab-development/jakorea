import { describe, expect, it } from 'vitest'
import { nextAdminNotificationPageParam } from './admin-notification-inbox-page'
import type { Notification } from '@/features/dashboard/api/notification-service'

function page(partial: {
  page: number
  size?: number
  totalPages?: number
  totalElements?: number
  itemCount: number
}) {
  return {
    page: partial.page,
    size: partial.size ?? 20,
    totalPages: partial.totalPages,
    totalElements: partial.totalElements,
    items: Array.from({ length: partial.itemCount }, (_, index) => ({
      id: String(index),
      type: 'system',
      title: '알림',
      body: '본문',
      read: false,
      createdAt: '2026-10-27T00:00:00.000Z',
    })) as Notification[],
  }
}

describe('nextAdminNotificationPageParam', () => {
  it('uses totalPages when present', () => {
    expect(nextAdminNotificationPageParam(page({ page: 0, totalPages: 2, itemCount: 20 }))).toBe(1)
    expect(nextAdminNotificationPageParam(page({ page: 1, totalPages: 2, itemCount: 13 }))).toBeUndefined()
  })

  it('falls back to totalElements then page size', () => {
    expect(nextAdminNotificationPageParam(page({ page: 0, totalElements: 33, itemCount: 20 }))).toBe(1)
    expect(nextAdminNotificationPageParam(page({ page: 1, totalElements: 33, itemCount: 13 }))).toBeUndefined()
    expect(nextAdminNotificationPageParam(page({ page: 0, itemCount: 20 }))).toBe(1)
    expect(nextAdminNotificationPageParam(page({ page: 0, itemCount: 7 }))).toBeUndefined()
  })
})
