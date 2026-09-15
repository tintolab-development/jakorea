import { describe, expect, it } from 'vitest'
import {
  buildApplicantNotificationResendMessage,
  shouldShowApplicantNotificationResendReason,
} from '@/features/program/general/lib/applicant-notification-resend'

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

  it('기관은 주체에 맞는 질문 문구를 사용한다', () => {
    expect(buildApplicantNotificationResendMessage('institution', '진월초', 'approved')).toContain(
      '[진월초]의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?'
    )
  })

  it('개인 승인은 스크린샷 카피를 사용하고 사유 입력을 숨긴다', () => {
    expect(buildApplicantNotificationResendMessage('individual', '김범수', 'approved')).toBe(
      '프로그램 승인 알림을 재발송하시겠습니까?\n확인 시 신청자에게 승인 알림이 재발송됩니다.'
    )
    expect(shouldShowApplicantNotificationResendReason('individual', 'approved')).toBe(false)
  })

  it('개인 반려는 반려 알림 카피와 사유 입력을 사용한다', () => {
    expect(buildApplicantNotificationResendMessage('individual', '김범수', 'rejected')).toBe(
      '프로그램 승인 반려 알림을 재발송하시겠습니까?\n확인 시 입력하신 반려 사유와 함께 알림이 재발송됩니다.'
    )
    expect(shouldShowApplicantNotificationResendReason('individual', 'rejected')).toBe(true)
  })
})
