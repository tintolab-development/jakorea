import { axiosClient } from '@/shared/api/axios-instance'

const NOTIFICATIONS_PATH = '/api/portal/me/notifications'
const UNREAD_COUNT_PATH = `${NOTIFICATIONS_PATH}/unread-count`

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

/** JABACK `MemberNotificationResponse` */
export type MemberNotificationResponse = {
  recipientId?: number
  eventId?: number
  eventType?: string
  notificationCategory?: string
  notificationCategoryLabel?: string
  title?: string
  message?: string
  sourceDomain?: string
  sourceId?: number
  programId?: number
  linkType?: string
  linkId?: number
  readAt?: string | null
  clickedAt?: string | null
  hiddenAt?: string | null
  createdAt?: string
}

export type MemberNotificationPageResponse = {
  items?: MemberNotificationResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export type FetchMyNotificationsParams = {
  page: number
  size: number
  /** 미지정이면 전체 카테고리 */
  category?: string
}

export async function fetchMyNotifications(
  params: FetchMyNotificationsParams,
  signal?: AbortSignal,
): Promise<MemberNotificationPageResponse> {
  const { data } = await axiosClient.get<unknown>(NOTIFICATIONS_PATH, {
    signal,
    params: {
      page: params.page,
      size: params.size,
      ...(params.category ? { category: params.category } : {}),
    },
  })
  return unwrapEnvelope<MemberNotificationPageResponse>(data)
}

export async function fetchMyNotificationUnreadCount(signal?: AbortSignal): Promise<number> {
  const { data } = await axiosClient.get<unknown>(UNREAD_COUNT_PATH, { signal })
  const unwrapped = unwrapEnvelope<{ unreadCount?: unknown }>(data)
  const count = Number(unwrapped?.unreadCount)
  return Number.isFinite(count) ? count : 0
}

/** 클릭 처리 — 서버에서 `read_at`도 함께 채운다 */
export async function markMyNotificationClicked(recipientId: number): Promise<void> {
  await axiosClient.patch(`${NOTIFICATIONS_PATH}/${recipientId}/clicked`)
}
