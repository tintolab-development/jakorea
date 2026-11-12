import { describe, expect, it } from 'vitest'
import { mapNotificationInboxItem } from './notification-adapters'

describe('mapNotificationInboxItem read state', () => {
  it('readAt이 없으면 미읽음으로 매핑한다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 1,
      title: '제목',
      message: '본문',
      createdAt: '2026-10-27T00:00:00.000Z',
    })
    expect(mapped?.read).toBe(false)
  })

  it('readAt이 있으면 읽음으로 매핑한다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 2,
      title: '제목',
      message: '본문',
      createdAt: '2026-10-27T00:00:00.000Z',
      readAt: '2026-10-27T01:00:00.000Z',
    })
    expect(mapped?.read).toBe(true)
  })
})

describe('mapNotificationInboxItem link target', () => {
  it('linkType·linkId·programId·sourceDomain을 target으로 옮긴다 (linkUrl 없음)', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 3,
      eventType: 'ADMIN_TEACHER_EMPLOYMENT_CHANGED',
      title: '교사 소속·재직 정보가 변경되었습니다.',
      message: '재직 상태 변경을 확인해 주세요.',
      sourceDomain: 'TEACHER_PROFILE',
      linkType: 'member',
      linkId: 501,
      createdAt: '2026-10-27T00:00:00.000Z',
    })
    expect(mapped?.link).toBeUndefined()
    expect(mapped?.target).toEqual({
      eventType: 'ADMIN_TEACHER_EMPLOYMENT_CHANGED',
      sourceDomain: 'TEACHER_PROFILE',
      linkType: 'MEMBER',
      linkId: '501',
    })
  })

  it('연결 정보가 전혀 없으면 target을 두지 않는다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 4,
      title: '제목',
      createdAt: '2026-10-27T00:00:00.000Z',
    })
    expect(mapped?.target).toBeUndefined()
  })
})
