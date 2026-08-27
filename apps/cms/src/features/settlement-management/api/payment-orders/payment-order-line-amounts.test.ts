import { describe, expect, it } from 'vitest'
import {
  formatPaymentOrderInstitutionDisplay,
  sumCountablePaymentOrderLineAmounts,
} from './payment-order-line-amounts'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

function row(
  estimatedAmount: number,
  processingStatus: PaymentOrderAdminLineProcessingStatus
) {
  return { estimatedAmount, processingStatus }
}

describe('sumCountablePaymentOrderLineAmounts', () => {
  it('신청 반려·지급 정정 요청 금액은 합산에서 제외', () => {
    expect(
      sumCountablePaymentOrderLineAmounts([
        row(100_000, 'pending'),
        row(50_000, 'application_rejected'),
        row(30_000, 'correction'),
        row(20_000, 'confirmed'),
      ])
    ).toBe(120_000)
  })

  it('전부 제외 대상이면 0', () => {
    expect(
      sumCountablePaymentOrderLineAmounts([
        row(10, 'application_rejected'),
        row(20, 'correction'),
      ])
    ).toBe(0)
  })
})

describe('formatPaymentOrderInstitutionDisplay', () => {
  it('빈 값·하이픈은 공란(비노출)', () => {
    expect(formatPaymentOrderInstitutionDisplay(null)).toBe('')
    expect(formatPaymentOrderInstitutionDisplay(undefined)).toBe('')
    expect(formatPaymentOrderInstitutionDisplay('')).toBe('')
    expect(formatPaymentOrderInstitutionDisplay('-')).toBe('')
    expect(formatPaymentOrderInstitutionDisplay('  -  ')).toBe('')
  })

  it('기관명은 trim 후 반환', () => {
    expect(formatPaymentOrderInstitutionDisplay(' ○○초 ')).toBe('○○초')
  })
})
