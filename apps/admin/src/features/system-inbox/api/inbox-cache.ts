import type { HomepageAdminSystemNotificationItem } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem'
import { isInboxItemRead } from './mappers.ts'

export function markInboxItemReadLocally(
  items: HomepageAdminSystemNotificationItem[],
  numericId: number,
  readAt: string,
): HomepageAdminSystemNotificationItem[] {
  return items.map(item =>
    item.id === numericId
      ? { ...item, read: true, readAt: item.readAt ?? readAt }
      : item,
  )
}

export function nextUnreadCountAfterRead(
  previousCount: number | undefined,
  previousList: HomepageAdminSystemNotificationItem[] | undefined,
  numericId: number,
): number | undefined {
  if (typeof previousCount !== 'number' || previousCount <= 0) return previousCount
  const wasUnread = previousList?.some(item => item.id === numericId && !isInboxItemRead(item))
  if (!wasUnread) return previousCount
  return previousCount - 1
}

export function mergeConfirmedInboxItem(
  items: HomepageAdminSystemNotificationItem[],
  item: HomepageAdminSystemNotificationItem,
): HomepageAdminSystemNotificationItem[] {
  if (item.id == null) return items
  const hasRow = items.some(row => row.id === item.id)
  return hasRow ? items.map(row => (row.id === item.id ? item : row)) : [item, ...items]
}
