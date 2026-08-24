import { describe, expect, it } from 'vitest'
import { buildPaymentOrdersDetailListParams } from './admin-payment-orders-service'

describe('buildPaymentOrdersDetailListParams', () => {
  it('프로그램 aggregateKey → programId 스코프', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '42',
        dateRange: null,
      })
    ).toEqual({ programId: 42 })
  })

  it('강사 aggregateKey → instructorMemberId 스코프', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'instructor',
        aggregateKey: '9001',
        dateRange: null,
      })
    ).toEqual({ instructorMemberId: 9001 })
  })

  it('목록 기간을 fromDate/toDate로 전달', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '10',
        dateRange: { from: '2026-08-01', to: '2026-09-01' },
      })
    ).toEqual({
      programId: 10,
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
    })
  })

  it('aggregateKey가 숫자가 아니면 빈 params', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: 'invalid',
        dateRange: null,
      })
    ).toEqual({})
  })
})
