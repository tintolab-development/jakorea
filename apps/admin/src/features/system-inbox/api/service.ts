import { getJAKoreaHomepageAdminAPISystemInboxSubset } from '@/shared/api/generated/notifications/notifications-api'
import type { HomepageAdminSystemNotificationItem } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem'

const INBOX_PAGE_SIZE = 50

function inboxApi() {
  return getJAKoreaHomepageAdminAPISystemInboxSubset()
}

export function listSystemInboxService(
  size = INBOX_PAGE_SIZE,
): Promise<HomepageAdminSystemNotificationItem[]> {
  return inboxApi().listHomepageAdminSystemNotifications({ size })
}

export async function countSystemInboxUnreadService(): Promise<number> {
  const response = await inboxApi().countHomepageAdminSystemNotifications()
  const value = response.unreadCount
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.trunc(value)
}

export function readSystemInboxItemService(
  id: number,
): Promise<HomepageAdminSystemNotificationItem> {
  return inboxApi().readHomepageAdminSystemNotification(id)
}

export { INBOX_PAGE_SIZE }
