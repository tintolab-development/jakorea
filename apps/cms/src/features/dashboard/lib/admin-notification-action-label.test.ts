import { describe, expect, it } from 'vitest'
import { resolveAdminNotificationActionLabel } from './admin-notification-action-label'

describe('resolveAdminNotificationActionLabel', () => {
  it('프로그램 신청 알림은 「신청 목록 보기」', () => {
    expect(
      resolveAdminNotificationActionLabel({
        target: { linkType: 'PROGRAM_APPLICATION', linkId: '7', programId: '12' },
      })
    ).toBe('신청 목록 보기')
  })

  it('이동 대상이 없으면 null (programId 없는 프로그램 알림·모르는 linkType)', () => {
    expect(
      resolveAdminNotificationActionLabel({ target: { linkType: 'PROGRAM_APPLICATION' } })
    ).toBeNull()
    expect(resolveAdminNotificationActionLabel({ target: { linkType: 'UNKNOWN' } })).toBeNull()
    expect(resolveAdminNotificationActionLabel({})).toBeNull()
  })

  it('link만 있는 알림은 기본 문구', () => {
    expect(resolveAdminNotificationActionLabel({ link: '/programs' })).toBe('자세히 보기')
  })

  it('회원·문의 알림은 이동 대상에 맞는 문구', () => {
    expect(
      resolveAdminNotificationActionLabel({ target: { linkType: 'MEMBER', linkId: '3' } })
    ).toBe('회원 상세 보기')
    expect(resolveAdminNotificationActionLabel({ target: { linkType: 'INQUIRY' } })).toBe(
      '문의 목록 보기'
    )
  })
})
