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

describe('mapNotificationInboxItem 프로그램 신규 신청자 (ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY)', () => {
  const message =
    '2026.11.13에 신규 접수된 신청자 수는 3명입니다.\n신청자 정보와 신청 내용을 확인해 주세요.'

  it('programName·두 줄 본문·PROGRAM_APPLICATION_LIST 이동 정보를 그대로 옮긴다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 101,
      eventId: 55,
      eventType: 'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY',
      notificationCategory: 'APPLICATION_MATCHING',
      title: '프로그램 신규 신청자',
      message,
      sourceDomain: 'PROGRAM_APPLICATION_OWNER_DAILY_SUMMARY',
      sourceId: 1,
      programId: 9201,
      programName: '경제교육 기본 과정',
      linkType: 'PROGRAM_APPLICATION_LIST',
      linkId: 9201,
      readAt: null,
      createdAt: '2026-11-14T00:00:00Z',
    })
    expect(mapped?.title).toBe('프로그램 신규 신청자')
    expect(mapped?.body).toBe(message)
    expect(mapped?.programName).toBe('경제교육 기본 과정')
    expect(mapped?.target).toEqual({
      eventType: 'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY',
      sourceDomain: 'PROGRAM_APPLICATION_OWNER_DAILY_SUMMARY',
      linkType: 'PROGRAM_APPLICATION_LIST',
      linkId: '9201',
      programId: '9201',
    })
  })

  it('title이 비면 eventType 라벨 「프로그램 신규 신청자」로 대체한다', () => {
    const mapped = mapNotificationInboxItem({
      recipientId: 103,
      eventType: 'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY',
      title: '',
      message,
      createdAt: '2026-11-14T00:00:00Z',
    })
    expect(mapped?.title).toBe('프로그램 신규 신청자')
  })
})

describe('mapNotificationInboxItem 탭 분류 (notificationCategory SSOT)', () => {
  const base = {
    recipientId: 201,
    title: '제목',
    message: '본문',
    createdAt: '2026-11-14T00:00:00Z',
  }

  it.each([
    ['APPLICATION_MATCHING', 'matching'],
    ['PROGRAM_PROGRESS', 'progress'],
    ['SETTLEMENT', 'settlement'],
    ['UPDATE', 'schedule'],
    ['INQUIRY_SYSTEM', 'inquiry'],
    ['SYSTEM', 'system'],
    ['APPROVAL_REJECTION', 'system'],
    ['application_matching', 'matching'],
  ])('%s → %s', (notificationCategory, expected) => {
    expect(mapNotificationInboxItem({ ...base, notificationCategory })?.type).toBe(expected)
  })

  it('eventType에 SCHEDULE이 있어도 PROGRAM_PROGRESS면 progress', () => {
    const mapped = mapNotificationInboxItem({
      ...base,
      eventType: 'ADMIN_UJAT_INSTITUTION_SCHEDULE_CONFIRMED',
      notificationCategory: 'PROGRAM_PROGRESS',
    })
    expect(mapped?.type).toBe('progress')
  })

  it('eventType에 SETTLEMENT가 있어도 카테고리가 없으면 eventType으로 정하지 않고 system', () => {
    const mapped = mapNotificationInboxItem({
      ...base,
      eventType: 'ADMIN_SETTLEMENT_APPLICATION_SUBMITTED',
    })
    expect(mapped?.type).toBe('system')
  })

  it('null이나 모르는 값이면 system', () => {
    expect(mapNotificationInboxItem({ ...base, notificationCategory: null })?.type).toBe('system')
    expect(mapNotificationInboxItem({ ...base, notificationCategory: 'NEW_CATEGORY' })?.type).toBe(
      'system'
    )
  })

  it('notificationCategory가 없으면 category 값을 같은 표로 정한다', () => {
    expect(mapNotificationInboxItem({ ...base, category: 'SETTLEMENT' })?.type).toBe('settlement')
  })
})
