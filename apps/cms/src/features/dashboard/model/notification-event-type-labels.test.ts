import { describe, expect, it } from 'vitest'
import {
  resolveNotificationEventTypeLabel,
  resolveNotificationInboxTitle,
} from './notification-event-type-labels'

describe('notification-event-type-labels', () => {
  it('known eventType을 한글로 매핑한다', () => {
    expect(resolveNotificationEventTypeLabel('MEMBER_LOGIN_FAILURE_NOTICE')).toBe(
      '로그인 실패 안내'
    )
    expect(
      resolveNotificationEventTypeLabel('ADMIN_INDIVIDUAL_PROGRAM_INSTRUCTOR_UNASSIGNED')
    ).toBe('개인 프로그램 교육진행자 미배정 건 안내')
    expect(resolveNotificationEventTypeLabel('ASSIGNMENT_FEEDBACK_REQUESTED')).toBe(
      '과제 피드백 확인 요청'
    )
    expect(
      resolveNotificationEventTypeLabel('UJAT_VOLUNTEER_ATTENDANCE_STATUS_CHANGED')
    ).toBe('UJAT 출석 현황 안내')
    expect(
      resolveNotificationEventTypeLabel('PROGRAM_PARTICIPANT_COMPLETION_NOT_COMPLETED')
    ).toBe('프로그램 수료 불가 안내')
    expect(
      resolveNotificationEventTypeLabel('ORGANIZATION_APPLICATION_APPROVAL_CANCELLED')
    ).toBe('기관 승인 취소')
  })

  it('회원/관리자 안내사항 라벨을 구분한다', () => {
    expect(resolveNotificationEventTypeLabel('PROGRAM_NOTICE_CREATED')).toBe(
      '신규 안내사항 안내'
    )
    expect(resolveNotificationEventTypeLabel('ADMIN_PROGRAM_NOTICE_CREATED')).toBe(
      '신규 안내사항 안내 (관리자)'
    )
  })

  it('미등록 코드는 fallback을 쓴다', () => {
    expect(resolveNotificationEventTypeLabel('UNKNOWN_EVENT_XYZ')).toBe('알림')
    expect(resolveNotificationEventTypeLabel('UNKNOWN_EVENT_XYZ', '기타 알림')).toBe('기타 알림')
  })

  it('title이 비거나 eventType raw면 라벨로 대체한다', () => {
    expect(
      resolveNotificationInboxTitle({
        title: '',
        eventType: 'MEMBER_SIGNUP_COMPLETED',
      })
    ).toBe('회원가입 완료 안내')
    expect(
      resolveNotificationInboxTitle({
        title: 'MEMBER_SIGNUP_COMPLETED',
        eventType: 'MEMBER_SIGNUP_COMPLETED',
      })
    ).toBe('회원가입 완료 안내')
    expect(
      resolveNotificationInboxTitle({
        title: '커스텀 제목',
        eventType: 'MEMBER_SIGNUP_COMPLETED',
      })
    ).toBe('커스텀 제목')
  })
})
