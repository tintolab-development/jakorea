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

  it('강사비 정정 요청은 「정정 요청 확인」, 강사비 확인 완료는 「지급 대상 목록 보기」', () => {
    expect(
      resolveAdminNotificationActionLabel({
        target: {
          eventType: 'ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED',
          linkType: 'SETTLEMENT',
          linkId: '5',
          programId: '10',
        },
      })
    ).toBe('정정 요청 확인')
    expect(
      resolveAdminNotificationActionLabel({
        target: { eventType: 'ADMIN_PAYMENT_STATEMENT_CONFIRMED', linkType: 'SETTLEMENT', linkId: '5', programId: '10' },
      })
    ).toBe('지급 대상 목록 보기')
  })

  it('시안 「시스템 안내 팝업」 버튼 문구', () => {
    const label = (eventType: string, linkType = 'PROGRAM_APPLICATION') =>
      resolveAdminNotificationActionLabel({
        target: { eventType, linkType, linkId: '7', programId: '10' },
      })
    expect(label('ADMIN_INSTRUCTOR_ROLE_REQUESTED', 'INSTRUCTOR_ROLE_REQUEST')).toBe('신청 목록 보기')
    expect(label('ADMIN_SIGNUP_APPROVAL_REQUESTED', 'ADMIN_APPROVAL_REQUEST')).toBe('신청 목록 보기')
    expect(label('ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY')).toBe('신청 목록 보기')
    expect(label('ADMIN_STUDENT_ROSTER_UNSUBMITTED')).toBe('학생 명단 확인')
    expect(label('ADMIN_PORTRAIT_CONSENT_UNSUBMITTED')).toBe('학생 명단 확인')
    expect(label('ADMIN_SETTLEMENT_APPLICATION_RESUBMITTED', 'SETTLEMENT_APPLICATION')).toBe(
      '신청 내역 확인'
    )
    expect(label('ADMIN_EXPENSE_RECEIPT_CONFIRMED', 'SETTLEMENT')).toBe('지급 대상 목록 보기')
    expect(label('ADMIN_INQUIRY_CREATED', 'INQUIRY')).toBe('문의 내용 확인')
    expect(label('ADMIN_TEACHER_EMPLOYMENT_CHANGED', 'MEMBER')).toBe('회원 정보 보기')
    expect(label('ADMIN_PROGRAM_NOTICE_CREATED', 'PROGRAM_POST')).toBe('게시글 확인')
    expect(label('ADMIN_PROGRAM_POST_COMMENT_CREATED', 'PROGRAM_POST')).toBe('댓글 확인')
    expect(label('ADMIN_ROLE_CHANGED', 'ADMIN_ACCOUNT')).toBe('내 정보 보기')
    expect(label('ADMIN_PROGRAM_APPLICATION_CANCELLED')).toBeNull()
    expect(label('ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED', 'PROGRAM_SCHEDULE')).toBe(
      '강사 배정'
    )
  })

  it('교육진행자 미배정은 제목의 역할이 있으면 그 값으로 「… 배정」', () => {
    const target = {
      eventType: 'ADMIN_ORGANIZATION_PROGRAM_INSTRUCTOR_UNASSIGNED',
      linkType: 'PROGRAM_SCHEDULE',
      linkId: '3',
      programId: '12',
    }
    expect(resolveAdminNotificationActionLabel({ target, title: '강사 미배정 건 안내' })).toBe(
      '강사 배정'
    )
    expect(
      resolveAdminNotificationActionLabel({
        target,
        title: '개인 프로그램 교육진행자 미배정 건 안내',
      })
    ).toBe('교육진행자 배정')
  })
})
