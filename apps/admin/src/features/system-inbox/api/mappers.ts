import type { HomepageAdminSystemNotificationItem } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem'
import { resolveInboxNavigationPath } from '../lib/action-path.ts'
import { resolveSystemInboxCategory, type SystemInboxCategory } from '../lib/inbox-category.ts'

export type SystemInboxListItem = {
  id: string
  numericId: number
  title: string
  body?: string
  createdAt: string
  read: boolean
  link?: string
  /** 드롭다운 탭·라벨 — 시안 신청·매칭 / 시스템 */
  category: SystemInboxCategory
  /** 안내 팝업 이동 버튼 문구 (서버 actionLabel, 예: 「지원 상세 보기」) */
  actionLabel?: string
}

function asText(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function isInboxItemRead(
  item: Pick<HomepageAdminSystemNotificationItem, 'read' | 'readAt'>,
): boolean {
  if (item.read === true) return true
  if (item.read === false) return false
  return typeof item.readAt === 'string' && item.readAt.trim().length > 0
}

export function mapInboxItemToListItem(
  item: HomepageAdminSystemNotificationItem,
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
    category: resolveSystemInboxCategory(item.notificationType),
    actionLabel: item.actionLabel?.trim() || undefined,
  }
}

export function mapInboxItemsToListItems(
  items: HomepageAdminSystemNotificationItem[] | undefined,
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
