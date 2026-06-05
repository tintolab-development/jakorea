import { describe, expect, it } from 'vitest'
import { buildApplicantNotificationResendMessage } from '@/features/program/general/lib/applicant-notification-resend'

describe('applicant-notification-resend', () => {
  it('강사 승인 상태는 승인 알림 재발송 문구를 사용한다', () => {
    expect(
      buildApplicantNotificationResendMessage('instructor', '박틴토', 'approved')
    ).toBe(
      '[박틴토] 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 강사님에게 승인 알림이 재발송됩니다.'
    )
  })

  it('강사 반려 상태는 반려 알림 재발송 문구를 사용한다', () => {
    expect(
      buildApplicantNotificationResendMessage('instructor', '박틴토', 'rejected')
    ).toBe(
      '[박틴토] 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 강사님에게 반려 알림이 재발송됩니다.'
    )
  })

  it('기관·개인은 주체에 맞는 질문 문구를 사용한다', () => {
    expect(buildApplicantNotificationResendMessage('institution', '진월초', 'approved')).toContain(
      '[진월초]의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?'
    )
    expect(buildApplicantNotificationResendMessage('individual', '김범수', 'rejected')).toContain(
      '[김범수] 님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?'
    )
  })
})
