import type { Notification } from '@/features/dashboard/api/notification-service'

export const ADMIN_NOTIFICATION_INBOX_PAGE_SIZE = 20

export type AdminNotificationInboxPage = {
  items: Notification[]
  page: number
  size: number
  totalPages?: number
  totalElements?: number
}

export function nextAdminNotificationPageParam(
  lastPage: AdminNotificationInboxPage
): number | undefined {
  const page = Number.isFinite(lastPage.page) ? lastPage.page : 0
  const size =
    Number.isFinite(lastPage.size) && lastPage.size > 0
      ? lastPage.size
      : lastPage.items.length
  if (typeof lastPage.totalPages === 'number' && Number.isFinite(lastPage.totalPages)) {
    return page + 1 < lastPage.totalPages ? page + 1 : undefined
  }
  if (
    typeof lastPage.totalElements === 'number' &&
    Number.isFinite(lastPage.totalElements) &&
    size > 0
  ) {
    return (page + 1) * size < lastPage.totalElements ? page + 1 : undefined
  }
  if (size > 0 && lastPage.items.length < size) return undefined
  if (lastPage.items.length === 0) return undefined
  return page + 1
}
