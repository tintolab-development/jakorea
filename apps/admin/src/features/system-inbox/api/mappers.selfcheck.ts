/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/system-inbox/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { HomepageAdminSystemNotificationItem } from '../../../shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItem.ts'
import {
  isInboxItemRead,
  mapInboxItemToListItem,
  mapInboxItemsToListItems,
  parseUnreadCount,
} from './mappers.ts'

const snapshot: HomepageAdminSystemNotificationItem = {
  id: 101,
  eventKey: 'CAREER_TALENT_APPLICATION:11',
  notificationType: 'CAREER_TALENT_APPLICATION',
  aggregateId: 11,
  title: '인재풀 신규 지원 안내',
  body: '홍길동님이 인재풀에 신규 등록했습니다.\n지원 내용을 확인해 주세요.',
  actionLabel: '지원 상세 보기',
  actionPath: '/ja-korea/recruit/applicants?applicationId=11',
  read: false,
  createdAt: '2026-10-28T09:00:00+09:00',
}

const mapped = mapInboxItemToListItem(snapshot)
assert.equal(mapped?.title, '인재풀 신규 지원 안내')
assert.equal(
  mapped?.body,
  '홍길동님이 인재풀에 신규 등록했습니다.\n지원 내용을 확인해 주세요.',
)
assert.equal(mapped?.link, '/ja-korea/recruit/applicants?applicationId=11')
assert.equal(mapped?.read, false)

const posting: HomepageAdminSystemNotificationItem = {
  id: 102,
  notificationType: 'CAREER_POSTING_DEADLINE',
  aggregateId: 44,
  title: '채용 공고 마감 안내',
  body: '프로그램 매니저 채용의 모집 마감 일주일 전입니다.',
  actionPath: '/ja-korea/recruit/postings',
  read: false,
  readAt: null,
  createdAt: '2026-10-27T09:00:00+09:00',
}

assert.equal(mapInboxItemToListItem(posting)?.link, '/ja-korea/recruit/postings')
assert.equal(mapInboxItemToListItem(posting)?.read, false)
assert.equal(isInboxItemRead({ read: false, readAt: null }), false)
assert.equal(isInboxItemRead({ read: true, readAt: null }), true)
assert.equal(isInboxItemRead({ readAt: '2026-10-28T09:00:00+09:00' }), true)

const sorted = mapInboxItemsToListItems([posting, snapshot])
assert.deepEqual(
  sorted.map(row => row.id),
  ['101', '102'],
)

assert.equal(parseUnreadCount(3), 3)
assert.equal(parseUnreadCount(-1), 0)
assert.equal(parseUnreadCount(undefined), 0)
assert.equal(mapInboxItemToListItem({ title: 'x' }), null)

console.log('system-inbox mappers selfcheck: ok')
