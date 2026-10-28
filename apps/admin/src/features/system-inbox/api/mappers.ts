import type { HomepageAdminSystemNotificationItem } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem'
import { resolveInboxNavigationPath } from '../lib/action-path.ts'

export type InboxItemContract = Omit<HomepageAdminSystemNotificationItem, 'readAt'> & {
  readAt?: string | null
}

export type SystemInboxListItem = {
  id: string
  numericId: number
  title: string
  body?: string
  createdAt: string
  read: boolean
  link?: string
}

function asText(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function isInboxItemRead(item: Pick<InboxItemContract, 'read' | 'readAt'>): boolean {
  if (item.read === true) return true
  if (item.read === false) return false
  return typeof item.readAt === 'string' && item.readAt.trim().length > 0
}

export function mapInboxItemToListItem(
  item: InboxItemContract,
): SystemInboxListItem | null {
  if (item.id == null || !Number.isFinite(item.id) || item.id <= 0) return null
  const link = resolveInboxNavigationPath({
    actionPath: item.actionPath,
    notificationType: item.notificationType,
    aggregateId: item.aggregateId,
  })
  return {
    id: String(item.id),
    numericId: item.id,
    title: asText(item.title),
    body: item.body?.trim() ? item.body : undefined,
    createdAt: item.createdAt?.trim() || '',
    read: isInboxItemRead(item),
    link: link ?? undefined,
  }
}

export function mapInboxItemsToListItems(
  items: InboxItemContract[] | undefined,
): SystemInboxListItem[] {
  return (items ?? [])
    .map(mapInboxItemToListItem)
    .filter((row): row is SystemInboxListItem => row != null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function parseUnreadCount(unreadCount: number | undefined): number {
  if (typeof unreadCount !== 'number' || !Number.isFinite(unreadCount) || unreadCount < 0) {
    return 0
  }
  return Math.trunc(unreadCount)
}
