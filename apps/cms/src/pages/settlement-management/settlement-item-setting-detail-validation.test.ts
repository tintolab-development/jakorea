import { describe, expect, it } from 'vitest'
import {
  validateWithholdingAmount,
  validateWithholdingRate,
  WITHHOLDING_AMOUNT_MAX,
} from './settlement-item-setting-detail-validation'

describe('settlement withholding detail validation', () => {
  it('세율은 0~100 및 소수 둘째 자리까지 허용한다', () => {
    expect(validateWithholdingRate('0')).toBeNull()
    expect(validateWithholdingRate('6')).toBeNull()
    expect(validateWithholdingRate('55')).toBeNull()
    expect(validateWithholdingRate('3.3')).toBeNull()
    expect(validateWithholdingRate('100.00')).toBeNull()
    expect(validateWithholdingRate('-0.01')).not.toBeNull()
    expect(validateWithholdingRate('100.01')).not.toBeNull()
    expect(validateWithholdingRate('1.234')).not.toBeNull()
  })

  it('세율과 금액의 빈 입력은 선택값으로 허용한다', () => {
    expect(validateWithholdingRate('')).toBeNull()
    expect(validateWithholdingAmount('')).toBeNull()
  })

  it('금액은 음수·소수·안전 정수 상한을 거부한다', () => {
    expect(validateWithholdingAmount('0')).toBeNull()
    expect(validateWithholdingAmount('1,000')).toBeNull()
    expect(validateWithholdingAmount(String(WITHHOLDING_AMOUNT_MAX))).toBeNull()
    expect(validateWithholdingAmount('-1')).not.toBeNull()
    expect(validateWithholdingAmount('100.5')).not.toBeNull()
    expect(validateWithholdingAmount('3.333')).toContain('정수')
    expect(validateWithholdingAmount(String(WITHHOLDING_AMOUNT_MAX + 1))).not.toBeNull()
  })
})
