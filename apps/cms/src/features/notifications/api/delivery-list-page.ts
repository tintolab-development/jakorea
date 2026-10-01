import type { NotificationDeliveryListResponse } from '@/shared/api/generated/notifications/schemas/notificationDeliveryListResponse'

/** 알림톡·메일·문자 발송 조회 공통 페이지 크기 */
export const SEND_HISTORY_PAGE_SIZE = 20

export type SendHistoryListPage<T> = {
  items: T[]
  page: number
  size: number
  /** BE `totalCount`. 없으면 null — 화면은 로드된 행 수로 대체 */
  totalCount: number | null
  hasNext: boolean
}

export function withSendHistoryPaging(
  params: Record<string, string>,
  page: number
): Record<string, string> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 0
  return {
    ...params,
    page: String(safePage),
    size: String(SEND_HISTORY_PAGE_SIZE),
  }
}

export function emptySendHistoryListPage<T>(page = 0): SendHistoryListPage<T> {
  return {
    items: [],
    page,
    size: SEND_HISTORY_PAGE_SIZE,
    totalCount: 0,
    hasNext: false,
  }
}

export function toSendHistoryListPage<T>(
  dto: NotificationDeliveryListResponse,
  requestedPage: number,
  mapItems: (items: NotificationDeliveryListResponse['items']) => T[]
): SendHistoryListPage<T> {
  const items = mapItems(dto.items)
  const size =
    typeof dto.size === 'number' && Number.isFinite(dto.size) && dto.size > 0
      ? dto.size
      : SEND_HISTORY_PAGE_SIZE
  const page =
    typeof dto.page === 'number' && Number.isFinite(dto.page) ? dto.page : requestedPage
  const totalCount =
    typeof dto.totalCount === 'number' && Number.isFinite(dto.totalCount) ? dto.totalCount : null
  const hasNext =
    totalCount != null ? (page + 1) * size < totalCount : items.length >= size

  return { items, page, size, totalCount, hasNext }
}
