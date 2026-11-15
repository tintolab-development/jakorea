import { describe, expect, it } from 'vitest'
import {
  buildPaymentOrderInstructorDetailPath,
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

  it('강사비 정정 요청은 settlementId로 신청자 별 지급 현황 상세, 강사비 확인 완료는 계좌 지급 대상 목록을 연다', () => {
    expect(
      resolveAdminNotificationNavigation({
        target: {
          eventType: 'ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED',
          linkType: 'SETTLEMENT',
          linkId: '5',
          programId: '10',
        },
      })
    ).toEqual({ kind: 'payment-statement-correction', settlementId: '5' })
    expect(
      resolveAdminNotificationNavigation({
        target: {
          eventType: 'ADMIN_PAYMENT_STATEMENT_CONFIRMED',
          linkType: 'SETTLEMENT',
          linkId: '5',
          programId: '10',
        },
      })
    ).toEqual({ kind: 'path', path: '/settlement-management/account-payments' })
    expect(
      resolveAdminNotificationNavigation({
        target: { eventType: 'ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED', linkType: 'SETTLEMENT' },
      })
    ).toBeNull()
  })

  it('신청자 별 지급 현황 상세 경로', () => {
    const path = buildPaymentOrderInstructorDetailPath('42')
    expect(path.startsWith('/settlement-management/payment-orders?')).toBe(true)
    const search = searchOf(path)
    expect(search.get('po_detail')).toBe('instructor')
    expect(search.get('po_detail_key')).toBe('42')
  })

  describe('시안 「시스템 안내 팝업」 이벤트별 이동', () => {
    const nav = (eventType: string, extra: Record<string, string> = {}) =>
      resolveAdminNotificationNavigation({
        target: { eventType, linkType: 'PROGRAM_APPLICATION', linkId: '7', programId: '10', ...extra },
      })

    it('권한 신청 알림은 권한 신청 관리의 해당 탭 목록', () => {
      expect(
        nav('ADMIN_SIGNUP_APPROVAL_REQUESTED', { linkType: 'ADMIN_APPROVAL_REQUEST' })
      ).toEqual({ kind: 'path', path: '/admin/permission-requests?pr_detail_role=admin' })
      expect(
        nav('ADMIN_INSTRUCTOR_ROLE_REQUESTED', { linkType: 'INSTRUCTOR_ROLE_REQUEST' })
      ).toEqual({ kind: 'path', path: '/admin/permission-requests?pr_detail_role=instructor' })
    })

    it('프로그램 신청 취소는 이동 버튼이 없다', () => {
      expect(nav('ADMIN_PROGRAM_APPLICATION_CANCELLED')).toBeNull()
    })

    it('강사 미배정·학생 명단·게시글 알림은 프로그램 상세의 진행 현황 탭', () => {
      expect(nav('ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED')).toEqual({
        kind: 'program',
        programId: '10',
        section: 'participants',
      })
      expect(nav('ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED')).toEqual({
        kind: 'program',
        programId: '10',
        section: 'instructors',
      })
      for (const eventType of [
        'ADMIN_STUDENT_ROSTER_SUBMITTED',
        'ADMIN_STUDENT_ROSTER_UPDATED',
        'ADMIN_STUDENT_ROSTER_UNSUBMITTED',
        'ADMIN_PORTRAIT_CONSENT_UNSUBMITTED',
      ]) {
        expect(nav(eventType)).toEqual({ kind: 'program', programId: '10', section: 'participants' })
      }
      expect(nav('ADMIN_PROGRAM_POST_COMMENT_CREATED', { linkType: 'PROGRAM_POST' })).toEqual({
        kind: 'program',
        programId: '10',
        section: 'posts',
      })
    })

    it('정산 신청은 지급조서 확인의 프로그램 별 상세', () => {
      const destination = nav('ADMIN_SETTLEMENT_APPLICATION_SUBMITTED', {
        linkType: 'SETTLEMENT_APPLICATION',
      })
      expect(destination?.kind).toBe('path')
      const path = destination?.kind === 'path' ? destination.path : ''
      const params = new URLSearchParams(path.split('?')[1])
      expect(path.startsWith('/settlement-management/payment-orders?')).toBe(true)
      expect(params.get('po_detail')).toBe('program')
      expect(params.get('po_detail_key')).toBe('10')
    })

    it('신규 문의는 해당 문의 상세, 관리자 권한 변경은 내 정보 확인', () => {
      expect(nav('ADMIN_INQUIRY_CREATED', { linkType: 'INQUIRY', linkId: '33' })).toEqual({
        kind: 'path',
        path: '/admin/posts/inquiries?inquiryId=33',
      })
      expect(nav('ADMIN_ROLE_CHANGED', { linkType: 'ADMIN_ACCOUNT' })).toEqual({ kind: 'profile' })
    })
  })
})
