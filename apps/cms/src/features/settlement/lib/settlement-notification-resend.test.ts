import { describe, expect, it } from 'vitest'
import {
  buildSettlementNotificationResendMessage,
  canResendInstructorInvoiceNotification,
  canResendSettlementCalculationStatementNotification,
  resolveSettlementNotificationResendKind,
} from './settlement-notification-resend'

describe('settlement-notification-resend', () => {
  it('확인 완료·지급 대기·지급완료·신청 반려·재신청만 재발송 대상으로 본다', () => {
    expect(resolveSettlementNotificationResendKind('confirmed')).toBe('confirmed')
    expect(resolveSettlementNotificationResendKind('awaiting_payment')).toBe('confirmed')
    expect(resolveSettlementNotificationResendKind('rejected')).toBe('paid')
    expect(resolveSettlementNotificationResendKind('application_rejected')).toBe('rejected')
    expect(resolveSettlementNotificationResendKind('reapplication')).toBe('correction_completed')
    expect(resolveSettlementNotificationResendKind('pending')).toBeNull()
    expect(resolveSettlementNotificationResendKind('correction')).toBeNull()
  })

  it('GET availableActions에 RESEND_NOTIFICATION이 있을 때만 허용한다', () => {
    expect(
      canResendSettlementCalculationStatementNotification('confirmed', ['RESEND_NOTIFICATION'])
    ).toBe(true)
    expect(
      canResendSettlementCalculationStatementNotification('confirmed', ['CONFIRM_PAYMENT_STATEMENT'])
    ).toBe(false)
    expect(canResendSettlementCalculationStatementNotification('confirmed', [])).toBe(false)
    expect(canResendSettlementCalculationStatementNotification('confirmed')).toBe(false)
    expect(
      canResendSettlementCalculationStatementNotification('pending', ['RESEND_NOTIFICATION'])
    ).toBe(false)
  })

  it('회원 산출 내역서도 GET RESEND_NOTIFICATION만 허용한다', () => {
    expect(
      canResendInstructorInvoiceNotification('payment_statement_verified', ['RESEND_NOTIFICATION'])
    ).toBe(true)
    expect(canResendInstructorInvoiceNotification('account_paid', ['RESEND_NOTIFICATION'])).toBe(
      true
    )
    expect(
      canResendInstructorInvoiceNotification('application_rejected', ['RESEND_NOTIFICATION'])
    ).toBe(true)
    expect(
      canResendInstructorInvoiceNotification('payment_statement_reapplication', [
        'RESEND_NOTIFICATION',
      ])
    ).toBe(true)
    expect(canResendInstructorInvoiceNotification('payment_statement_verified')).toBe(false)
    expect(canResendInstructorInvoiceNotification('awaiting_confirmation', [
      'RESEND_NOTIFICATION',
    ])).toBe(false)
    expect(canResendInstructorInvoiceNotification('payment_correction_requested')).toBe(false)
  })

  it('반려 재발송 문구는 사유 입력을 안내한다', () => {
    expect(buildSettlementNotificationResendMessage('rejected')).toContain('반려 사유')
    expect(buildSettlementNotificationResendMessage('confirmed')).toContain('확인 완료')
  })

  it('확인 완료 재발송 문구는 지급조서 시안 문구를 쓴다', () => {
    expect(buildSettlementNotificationResendMessage('confirmed')).toBe(
      '지급조서 확인 완료 알림을 재발송하시겠습니까?\n발송 예정인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.'
    )
  })
})
