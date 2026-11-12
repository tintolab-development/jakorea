import { describe, expect, it } from 'vitest'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

describe('formatPaymentOrderCalculationWonPlain', () => {
  it('숫자는 원 단위로 표시한다', () => {
    expect(formatPaymentOrderCalculationWonPlain(170000)).toBe('170,000원')
    expect(formatPaymentOrderCalculationWonPlain(0)).toBe('0원')
  })

  it('금액이 빠진 부분 payload는 TypeError 없이 「-」', () => {
    expect(formatPaymentOrderCalculationWonPlain(undefined)).toBe('-')
    expect(formatPaymentOrderCalculationWonPlain(null)).toBe('-')
    expect(formatPaymentOrderCalculationWonPlain(Number.NaN)).toBe('-')
  })
})
