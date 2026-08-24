import { describe, expect, it } from 'vitest'
import {
  formatPaymentOrderCalculationItemLabel,
  formatSettlementItemTypeLabel,
} from './settlement-item-type'

describe('formatSettlementItemTypeLabel', () => {
  it('알려진 enum을 한글 라벨로 변환', () => {
    expect(formatSettlementItemTypeLabel('instructor_fee')).toBe('강사비')
    expect(formatSettlementItemTypeLabel('transportation')).toBe('교통비')
    expect(formatSettlementItemTypeLabel('accommodation')).toBe('숙박비')
    expect(formatSettlementItemTypeLabel('meal')).toBe('식사비')
    expect(formatSettlementItemTypeLabel('activity')).toBe('활동비')
    expect(formatSettlementItemTypeLabel('withholding')).toBe('원천징수')
    expect(formatSettlementItemTypeLabel('other')).toBe('기타')
  })

  it('미정의 type은 원문 유지', () => {
    expect(formatSettlementItemTypeLabel('custom_fee')).toBe('custom_fee')
  })

  it('빈 값은 fallback', () => {
    expect(formatSettlementItemTypeLabel(undefined)).toBe('정산 항목')
    expect(formatSettlementItemTypeLabel('  ')).toBe('정산 항목')
  })
})

describe('formatPaymentOrderCalculationItemLabel', () => {
  it('type=withholding은 금액과 무관하게 원천징수', () => {
    expect(formatPaymentOrderCalculationItemLabel('withholding', 5000)).toBe('원천징수')
  })

  it('type 없이 음수 금액은 원천징수 fallback', () => {
    expect(formatPaymentOrderCalculationItemLabel(undefined, -1000)).toBe('원천징수')
  })
})
