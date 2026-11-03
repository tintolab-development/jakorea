import { describe, expect, it } from 'vitest'
import {
  isInstructorPaymentStatementViewUnavailable,
  isPaymentStatementApplicationMissing,
  PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT,
} from './payment-statement-view-unavailable-alert'

describe('payment-statement-view-unavailable-alert', () => {
  it('Alert 카피는 조회 불가 안내 스펙과 같다', () => {
    expect(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT.title).toBe('지급조서 조회 불가')
    expect(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT.confirmLabel).toBe('확인')
    expect(String(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT.content)).toContain(
      '아직 제출된 지급조서가 없어 상세 내역을 확인할 수 없습니다.'
    )
    expect(String(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT.content)).toContain(
      '지급조서 신청 이후 확인해 주세요.'
    )
  })

  it('강사 회원 정산 — 미신청만 조회 불가, 신청 반려·확인 대기는 조회 가능', () => {
    expect(isInstructorPaymentStatementViewUnavailable('none')).toBe(true)
    expect(isInstructorPaymentStatementViewUnavailable('awaiting_confirmation')).toBe(false)
    expect(isInstructorPaymentStatementViewUnavailable('payment_statement_reapplication')).toBe(
      false
    )
    expect(isInstructorPaymentStatementViewUnavailable('application_rejected')).toBe(false)
    expect(isInstructorPaymentStatementViewUnavailable('payment_statement_verified')).toBe(false)
    expect(isInstructorPaymentStatementViewUnavailable('account_paid')).toBe(false)
    expect(isInstructorPaymentStatementViewUnavailable('payment_correction_requested')).toBe(false)
  })

  it('신청 이력 없으면 조회 불가', () => {
    expect(isPaymentStatementApplicationMissing(false)).toBe(true)
    expect(isPaymentStatementApplicationMissing(true)).toBe(false)
  })
})
