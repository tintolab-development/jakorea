import { describe, expect, it } from 'vitest'
import {
  hasAdminNotificationNavigation,
  resolveAdminNotificationNavigation,
} from './admin-notification-navigation'

function searchOf(path: string): URLSearchParams {
  return new URLSearchParams(path.split('?')[1] ?? '')
}

describe('resolveAdminNotificationNavigation', () => {
  it('link가 있으면 그대로 쓴다 (mock·linkUrl 호환)', () => {
    expect(resolveAdminNotificationNavigation({ link: '/programs' })).toEqual({
      kind: 'path',
      path: '/programs',
    })
  })

  it('교사 재직 상태 변경(MEMBER + TEACHER_PROFILE)은 교사 회원 상세로 연다', () => {
    const result = resolveAdminNotificationNavigation({
      target: { linkType: 'MEMBER', linkId: '501', sourceDomain: 'TEACHER_PROFILE' },
    })
    expect(result?.kind).toBe('path')
    const path = result?.kind === 'path' ? result.path : ''
    expect(path.startsWith('/users/list?')).toBe(true)
    const params = searchOf(path)
    expect(params.get('id')).toBe('501')
    expect(params.get('memberId')).toBe('501')
    expect(params.get('memberRole')).toBe('INSTRUCTOR')
    expect(params.get('instructorProfile')).toBe('school_teacher')
  })

  it('일반 MEMBER는 역할 힌트 없이 회원 상세로 연다', () => {
    const result = resolveAdminNotificationNavigation({
      target: { linkType: 'MEMBER', linkId: '7', sourceDomain: 'MEMBER' },
    })
    const params = searchOf(result?.kind === 'path' ? result.path : '')
    expect(params.get('memberId')).toBe('7')
    expect(params.get('memberRole')).toBeNull()
  })

  it('프로그램 범위 linkType은 programId로 프로그램 상세를 연다', () => {
    for (const linkType of [
      'PROGRAM_APPLICATION',
      'PROGRAM_POST',
      'PROGRAM_SCHEDULE',
      'SETTLEMENT',
      'SETTLEMENT_APPLICATION',
    ]) {
      expect(
        resolveAdminNotificationNavigation({
          target: { linkType, linkId: '9001', programId: '120' },
        })
      ).toEqual({ kind: 'program', programId: '120' })
    }
  })

  it('PROGRAM_APPLICATION_LIST는 linkId가 programId다', () => {
    expect(
      resolveAdminNotificationNavigation({
        target: { linkType: 'PROGRAM_APPLICATION_LIST', linkId: '120' },
      })
    ).toEqual({ kind: 'program', programId: '120' })
  })

  it('programId 없는 신청 알림은 이동하지 않는다 (applicationId로 프로그램을 추측하지 않음)', () => {
    expect(
      resolveAdminNotificationNavigation({
        target: { linkType: 'PROGRAM_APPLICATION', linkId: '9001' },
      })
    ).toBeNull()
  })

  it('관리자 계정·권한 요청·문의 매핑', () => {
    const admin = resolveAdminNotificationNavigation({
      target: { linkType: 'ADMIN_ACCOUNT', linkId: '3' },
    })
    expect(searchOf(admin?.kind === 'path' ? admin.path : '').get('id')).toBe('admin-account-3')
    expect(
      resolveAdminNotificationNavigation({ target: { linkType: 'INSTRUCTOR_ROLE_REQUEST', linkId: '1' } })
    ).toEqual({ kind: 'path', path: '/admin/permission-requests' })
    expect(
      resolveAdminNotificationNavigation({ target: { linkType: 'INQUIRY', linkId: '1' } })
    ).toEqual({ kind: 'path', path: '/admin/posts/inquiries' })
  })

  it('모르는 linkType·연결 정보 없음은 이동하지 않는다', () => {
    expect(hasAdminNotificationNavigation({ target: { linkType: 'INTERNAL_ROUTE', linkId: '1' } })).toBe(
      false
    )
    expect(hasAdminNotificationNavigation({})).toBe(false)
  })
})
