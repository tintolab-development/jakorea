import { describe, expect, it } from 'vitest'
import {
  formatAccountPaymentInstitutionDisplay,
  formatAccountPaymentSessionLabelDisplay,
  mockAccountPaymentRows,
  ACCOUNT_PAYMENT_STATUS_LABELS,
} from './account-payments-list'

describe('account-payments-list mock (시안 v2)', () => {
  it('목록 상태는 대기/완료 2종만 시드한다', () => {
    const statuses = new Set(mockAccountPaymentRows.map(r => r.accountPaymentStatus))
    expect(statuses.has('awaiting_confirmation')).toBe(true)
    expect(statuses.has('account_paid')).toBe(true)
    expect(statuses.has('partial_confirmation')).toBe(false)
    expect(statuses.has('payment_correction_requested')).toBe(false)
  })

  it('시안 라벨·규모·계좌·개인 프로그램 행을 포함한다', () => {
    expect(mockAccountPaymentRows.length).toBeGreaterThanOrEqual(30)
    expect(ACCOUNT_PAYMENT_STATUS_LABELS.awaiting_confirmation).toBe('계좌 지급 대기 중')
    expect(ACCOUNT_PAYMENT_STATUS_LABELS.account_paid).toBe('계좌 지급 완료')

    const withBank = mockAccountPaymentRows.filter(r => r.bankName && r.depositAccountNumber)
    expect(withBank.length).toBe(mockAccountPaymentRows.length)

    const personal = mockAccountPaymentRows.filter(
      r => !r.institutionName.trim() && !r.sessionLabel.trim()
    )
    expect(personal.length).toBeGreaterThanOrEqual(1)
  })

  it('기관·차시 빈 값은 UI에서 - 로 표시한다', () => {
    expect(formatAccountPaymentInstitutionDisplay('')).toBe('-')
    expect(formatAccountPaymentSessionLabelDisplay('')).toBe('-')
    expect(formatAccountPaymentSessionLabelDisplay('2 ~ 3차시')).toBe('2 ~ 3차시')
  })
})
