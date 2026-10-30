/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/system-inbox/api/hooks.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { QueryClient } from '@tanstack/react-query'
import type { HomepageAdminSystemNotificationItem } from '../../../shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem.ts'
import {
  markInboxItemReadLocally,
  mergeConfirmedInboxItem,
  nextUnreadCountAfterRead,
} from './inbox-cache.ts'
import { systemInboxQueryKeys } from './query-keys.ts'

const unread: HomepageAdminSystemNotificationItem = {
  id: 7,
  title: '인재풀 신규 지원 안내',
  read: false,
  readAt: null,
  createdAt: '2026-10-28T09:00:00+09:00',
}

const alreadyRead: HomepageAdminSystemNotificationItem = {
  id: 8,
  title: '채용 공고 마감 안내',
  read: true,
  readAt: '2026-10-27T09:00:00+09:00',
  createdAt: '2026-10-27T09:00:00+09:00',
}

const marked = markInboxItemReadLocally([unread, alreadyRead], 7, '2026-10-28T10:00:00+09:00')
assert.equal(marked[0]?.read, true)
assert.equal(marked[0]?.readAt, '2026-10-28T10:00:00+09:00')
assert.equal(marked[1]?.read, true)

assert.equal(nextUnreadCountAfterRead(2, [unread, alreadyRead], 7), 1)
assert.equal(nextUnreadCountAfterRead(2, [unread, alreadyRead], 8), 2)
assert.equal(nextUnreadCountAfterRead(undefined, [unread], 7), undefined)

const confirmed: HomepageAdminSystemNotificationItem = {
  ...unread,
  read: true,
  readAt: '2026-10-28T10:00:00+09:00',
}
assert.equal(mergeConfirmedInboxItem([unread], confirmed)[0]?.readAt, confirmed.readAt)
assert.equal(mergeConfirmedInboxItem([], confirmed)[0]?.id, 7)

const client = new QueryClient()
const a = 'admin-a'
const b = 'admin-b'
client.setQueryData(systemInboxQueryKeys.unreadCount(a), 3)
client.setQueryData(systemInboxQueryKeys.unreadCount(b), 9)
client.setQueryData(systemInboxQueryKeys.unreadCount(a), nextUnreadCountAfterRead(3, [unread], 7))
assert.equal(client.getQueryData(systemInboxQueryKeys.unreadCount(a)), 2)
assert.equal(client.getQueryData(systemInboxQueryKeys.unreadCount(b)), 9)
assert.notDeepEqual(systemInboxQueryKeys.scope(a), systemInboxQueryKeys.scope(b))

console.log('system-inbox hooks selfcheck: ok')
