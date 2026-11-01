import { describe, expect, it } from 'vitest'
import {
  SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS,
  parseSettlementCorrectionCalculationUnit,
  settlementCorrectionCalculationUnitLabel,
} from './settlement-correction-calculation-unit'

describe('settlement-correction-calculation-unit', () => {
  it('옵션 3종(출강 1회당·1시간당·1차시당)을 노출한다', () => {
    expect(SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS.map(o => o.value)).toEqual([
      'PER_LECTURE',
      'PER_HOUR',
      'PER_CLASS',
    ])
    expect(SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS.map(o => o.label)).toEqual([
      '출강 1회당',
      '1시간당',
      '1차시당',
    ])
  })

  it('서버 단위를 라벨로 복원하고 알 수 없으면 null', () => {
    expect(settlementCorrectionCalculationUnitLabel('PER_CLASS')).toBe('1차시당')
    expect(settlementCorrectionCalculationUnitLabel('PER_LECTURE')).toBe('출강 1회당')
    expect(settlementCorrectionCalculationUnitLabel('PER_HOUR')).toBe('1시간당')
    expect(settlementCorrectionCalculationUnitLabel('SESSION')).toBeNull()
  })

  it('페이로드용 enum만 허용한다', () => {
    expect(parseSettlementCorrectionCalculationUnit('per_class')).toBe('PER_CLASS')
    expect(parseSettlementCorrectionCalculationUnit('PER_SESSION')).toBeNull()
  })
})
