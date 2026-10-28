import type { Notification } from '@/features/dashboard/api/notification-service'

/** 미읽음 조회와 전체 인박스를 id 기준으로 합친다. 같은 id면 미읽음을 우선한다. */
export function mergeAdminNotificationInbox(
  unread: readonly Notification[],
  inbox: readonly Notification[]
): Notification[] {
  const byId = new Map<string, Notification>()
  for (const row of inbox) {
    byId.set(row.id, row)
  }
  for (const row of unread) {
    const prev = byId.get(row.id)
    if (!prev || (prev.read && !row.read)) {
      byId.set(row.id, row)
    }
  }
  return [...byId.values()]
}
