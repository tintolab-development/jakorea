import { describe, expect, it } from 'vitest'
import {
  buildApplicantNotificationResendMessage,
  canResendApplicationResultNotification,
  canResendVolunteerDocumentResultNotification,
  resolveOptionalNotificationResendReason,
  shouldShowApplicantNotificationResendReason,
} from '@/features/program/general/lib/applicant-notification-resend'

describe('applicant-notification-resend', () => {
  it('강사 승인 상태는 승인 알림 재발송 문구를 사용한다', () => {
    expect(
      buildApplicantNotificationResendMessage('instructor', '박틴토', 'approved')
    ).toBe(
      '**[박틴토]** 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 강사님에게 승인 알림이 재발송됩니다.'
    )
  })

  it('강사 반려 상태는 반려 알림 재발송 문구를 사용한다', () => {
    expect(
      buildApplicantNotificationResendMessage('instructor', '박틴토', 'rejected')
    ).toBe(
      '**[박틴토]** 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?\n확인 시 강사님에게 반려 알림이 재발송됩니다.'
    )
  })

  it('기관은 주체에 맞는 질문 문구를 사용한다', () => {
    expect(buildApplicantNotificationResendMessage('institution', '진월초', 'approved')).toContain(
      '**[진월초]**의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?'
    )
  })

  it('개인 승인은 스크린샷 카피를 사용하고 사유 입력을 숨긴다', () => {
    expect(buildApplicantNotificationResendMessage('individual', '김범수', 'approved')).toBe(
      '프로그램 승인 알림을 재발송하시겠습니까?\n확인 시 신청자에게 승인 알림이 재발송됩니다.'
    )
    expect(shouldShowApplicantNotificationResendReason('individual', 'approved')).toBe(false)
  })

  it('availableActions에 RESEND_NOTIFICATION이 있으면 승인·반려만 재발송한다', () => {
    expect(
      canResendApplicationResultNotification({
        approvalStatus: 'approved',
        availableActions: ['RESEND_NOTIFICATION'],
      })
    ).toBe(true)
    expect(
      canResendApplicationResultNotification({
        approvalStatus: 'pending',
        availableActions: ['RESEND_NOTIFICATION'],
      })
    ).toBe(false)
    expect(
      canResendApplicationResultNotification({
        approvalStatus: 'rejected',
        availableActions: ['GIVE_UP'],
      })
    ).toBe(false)
    expect(
      canResendApplicationResultNotification({
        approvalStatus: 'approved',
        availableActions: [],
      })
    ).toBe(true)
  })

  it('봉사자 서류는 GET RESEND_NOTIFICATION이 있고 면접 최종이 아닐 때만 재발송한다', () => {
    expect(
      canResendVolunteerDocumentResultNotification({
        documentScreeningStatus: 'pass',
        availableActions: ['RESEND_NOTIFICATION'],
      })
    ).toBe(true)
    expect(
      canResendVolunteerDocumentResultNotification({
        documentScreeningStatus: 'fail',
        availableActions: ['RESEND_NOTIFICATION'],
      })
    ).toBe(true)
    expect(
      canResendVolunteerDocumentResultNotification({ documentScreeningStatus: 'pass' })
    ).toBe(false)
    expect(
      canResendVolunteerDocumentResultNotification({
        documentScreeningStatus: 'pending',
        availableActions: ['RESEND_NOTIFICATION'],
      })
    ).toBe(false)
    expect(
      canResendVolunteerDocumentResultNotification({
        documentScreeningStatus: 'pass',
        availableActions: ['RESEND_NOTIFICATION'],
        secondInterviewScreeningStatus: 'pass',
      })
    ).toBe(false)
    expect(
      canResendVolunteerDocumentResultNotification({
        documentScreeningStatus: 'fail',
        availableActions: ['RESEND_NOTIFICATION'],
        applicationStatus: 'APPROVED',
      })
    ).toBe(false)
    expect(
      buildApplicantNotificationResendMessage('volunteer_document', '박봉사', 'approved')
    ).toContain('서류 심사 합격 알림을 재발송하시겠습니까?')
    expect(shouldShowApplicantNotificationResendReason('volunteer_document', 'rejected')).toBe(true)
    expect(
      shouldShowApplicantNotificationResendReason('volunteer_document', 'rejected', '서류 미비')
    ).toBe(false)
    expect(resolveOptionalNotificationResendReason(true, '', '서류 미비')).toBeNull()
    expect(resolveOptionalNotificationResendReason(true, '직접 입력', '서류 미비')).toBe(
      '직접 입력'
    )
  })

  it('기관 반려는 사유 입력을 노출한다', () => {
    expect(shouldShowApplicantNotificationResendReason('institution', 'rejected')).toBe(true)
    expect(shouldShowApplicantNotificationResendReason('institution', 'approved')).toBe(false)
    expect(
      buildApplicantNotificationResendMessage('institution', '진월초', 'rejected')
    ).toContain('입력하신 반려 사유와 함께')
  })
})
