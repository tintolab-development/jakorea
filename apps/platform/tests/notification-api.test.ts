import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMyNotifications,
  markMyNotificationClicked,
  markMyNotificationRead,
  markMyNotificationsReadAll,
} from '../src/features/notification/api/client'

const { getMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
}))

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    get: getMock,
    patch: patchMock,
  },
}))

const NOTIFICATIONS_URL = '/api/portal/me/notifications'

function notification(
  recipientId: number,
  readAt: string | null,
  createdAt: string,
) {
  return {
    recipientId,
    eventId: recipientId + 100,
    eventType: 'NOTICE',
    notificationCategory: 'PROGRAM',
    notificationCategoryLabel: '프로그램',
    title: `알림 ${recipientId}`,
    message: '알림 내용',
    readAt,
    clickedAt: readAt,
    hiddenAt: null,
    createdAt,
  }
}

describe('member notification API contract', () => {
  beforeEach(() => {
    getMock.mockReset()
    patchMock.mockReset()
    patchMock.mockResolvedValue({ data: { success: true, data: null } })
  })

  it('서버가 반환한 알림 순서를 변경하지 않고 기본 page/size를 사용한다', async () => {
    const items = [
      notification(101, null, '2026-10-27T09:00:00Z'),
      notification(100, null, '2026-10-27T08:00:00Z'),
      notification(99, '2026-10-27T07:00:00Z', '2026-10-27T10:00:00Z'),
    ]
    getMock.mockResolvedValue({
      data: {
        items,
        page: 0,
        size: 20,
        totalElements: 3,
        totalPages: 1,
      },
    })

    const result = await fetchMyNotifications({})

    expect(result.items.map(item => item.recipientId)).toEqual([101, 100, 99])
    expect(getMock).toHaveBeenCalledWith(NOTIFICATIONS_URL, {
      signal: undefined,
      params: { page: 0, size: 20 },
    })
  })

  it('unreadOnly와 category를 API query parameter로 전달한다', async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 1, size: 2, totalElements: 0, totalPages: 0 },
    })
    const controller = new AbortController()

    await fetchMyNotifications(
      { page: 1, size: 2, unreadOnly: true, category: 'PROGRAM' },
      controller.signal,
    )

    expect(getMock).toHaveBeenCalledWith(NOTIFICATIONS_URL, {
      signal: controller.signal,
      params: { page: 1, size: 2, unreadOnly: true, category: 'PROGRAM' },
    })
  })

  it('success=false/data=null을 빈 목록으로 정규화하지 않는다', async () => {
    getMock.mockResolvedValue({
      data: {
        success: false,
        data: null,
        error: { code: 'NOTIFICATION_LIST_UNAVAILABLE' },
      },
    })

    await expect(fetchMyNotifications({})).rejects.toThrow(
      '알림 API 응답을 처리할 수 없습니다.',
    )
  })

  it('readAt이 누락된 응답은 읽지 않은 알림으로 임의 처리하지 않는다', async () => {
    const invalid = notification(101, null, '2026-10-27T09:00:00Z')
    delete (invalid as { readAt?: string | null }).readAt
    getMock.mockResolvedValue({
      data: { items: [invalid], page: 0, size: 20, totalElements: 1, totalPages: 1 },
    })

    await expect(fetchMyNotifications({})).rejects.toThrow(
      '알림 API 응답을 처리할 수 없습니다.',
    )
  })

  it('clicked/read/read-all mutation endpoint를 계약대로 호출한다', async () => {
    await markMyNotificationClicked(101)
    await markMyNotificationRead(100)
    await markMyNotificationsReadAll()

    expect(patchMock.mock.calls.map(([url]) => url)).toEqual([
      `${NOTIFICATIONS_URL}/101/clicked`,
      `${NOTIFICATIONS_URL}/100/read`,
      `${NOTIFICATIONS_URL}/read-all`,
    ])
  })
})
