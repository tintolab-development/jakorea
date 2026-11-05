import { axiosClient } from '@/shared/api/axios-instance'

const NOTIFICATIONS_PATH = '/api/portal/me/notifications'
const UNREAD_COUNT_PATH = `${NOTIFICATIONS_PATH}/unread-count`

class NotificationApiError extends Error {
  readonly response: { status: number; data: unknown }

  constructor(data: unknown, status = 200) {
    super('알림 API 응답을 처리할 수 없습니다.')
    this.name = 'NotificationApiError'
    this.response = { status, data }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (isRecord(payload) && 'success' in payload) {
    if (payload.success !== true || !('data' in payload)) {
      throw new NotificationApiError(payload)
    }
    return unwrapEnvelope<T>(payload.data)
  }
  return payload as T
}

/** JABACK `MemberNotificationResponse` */
export type MemberNotificationResponse = {
  recipientId: number
  eventId: number
  eventType: string
  /** BE는 미분류 시 null. 표시는 notificationCategoryLabel(예: 기타)만 사용한다. */
  notificationCategory: string | null
  notificationCategoryLabel: string
  title: string
  message: string
  sourceDomain?: string
  sourceId?: number
  programId?: number
  linkType?: string
  linkId?: number
  readAt: string | null
  clickedAt: string | null
  hiddenAt: string | null
  createdAt: string
}

export type MemberNotificationPageResponse = {
  items: MemberNotificationResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type FetchMyNotificationsParams = {
  page?: number
  size?: number
  /** 미지정이면 전체 카테고리 */
  category?: string
  unreadOnly?: boolean
}

function parseNotification(value: unknown): MemberNotificationResponse {
  if (
    !isRecord(value) ||
    !isSafeNonNegativeInteger(value.recipientId) ||
    !isSafeNonNegativeInteger(value.eventId) ||
    typeof value.eventType !== 'string' ||
    !isNullableString(value.notificationCategory) ||
    typeof value.notificationCategoryLabel !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.message !== 'string' ||
    !isNullableString(value.readAt) ||
    !isNullableString(value.clickedAt) ||
    !isNullableString(value.hiddenAt) ||
    typeof value.createdAt !== 'string'
  ) {
    throw new NotificationApiError(value)
  }
  return value as unknown as MemberNotificationResponse
}

function parseNotificationPage(value: unknown): MemberNotificationPageResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !isSafeNonNegativeInteger(value.page) ||
    !isSafeNonNegativeInteger(value.size) ||
    value.size <= 0 ||
    !isSafeNonNegativeInteger(value.totalElements) ||
    !isSafeNonNegativeInteger(value.totalPages)
  ) {
    throw new NotificationApiError(value)
  }
  return {
    items: value.items.map(parseNotification),
    page: value.page,
    size: value.size,
    totalElements: value.totalElements,
    totalPages: value.totalPages,
  }
}

function parseUnreadCount(value: unknown): number {
  if (!isRecord(value) || !isSafeNonNegativeInteger(value.unreadCount)) {
    throw new NotificationApiError(value)
  }
  return value.unreadCount
}

export async function fetchMyNotifications(
  params: FetchMyNotificationsParams,
  signal?: AbortSignal,
): Promise<MemberNotificationPageResponse> {
  const { data } = await axiosClient.get<unknown>(NOTIFICATIONS_PATH, {
    signal,
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...(params.unreadOnly == null ? {} : { unreadOnly: params.unreadOnly }),
      ...(params.category ? { category: params.category } : {}),
    },
  })
  return parseNotificationPage(unwrapEnvelope<unknown>(data))
}

export async function fetchMyNotificationUnreadCount(
  category?: string,
  signal?: AbortSignal,
): Promise<number> {
  const { data } = await axiosClient.get<unknown>(UNREAD_COUNT_PATH, {
    signal,
    params: category ? { category } : undefined,
  })
  return parseUnreadCount(unwrapEnvelope<unknown>(data))
}

/** 클릭 처리 — 서버에서 `read_at`도 함께 채운다 */
export async function markMyNotificationClicked(recipientId: number): Promise<void> {
  const { data } = await axiosClient.patch(`${NOTIFICATIONS_PATH}/${recipientId}/clicked`)
  unwrapEnvelope<unknown>(data)
}

/** 개별 읽음 처리 */
export async function markMyNotificationRead(recipientId: number): Promise<void> {
  const { data } = await axiosClient.patch(`${NOTIFICATIONS_PATH}/${recipientId}/read`)
  unwrapEnvelope<unknown>(data)
}

/** 전체 읽음 처리 */
export async function markMyNotificationsReadAll(): Promise<void> {
  const { data } = await axiosClient.patch(`${NOTIFICATIONS_PATH}/read-all`)
  unwrapEnvelope<unknown>(data)
}
