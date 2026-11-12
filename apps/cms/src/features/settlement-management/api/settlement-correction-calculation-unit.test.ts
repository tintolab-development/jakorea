import { describe, expect, it } from 'vitest'
import {
  SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS,
  parseSettlementCorrectionCalculationUnit,
  settlementCorrectionCalculationUnitLabel,
} from './settlement-correction-calculation-unit'

describe('settlement-correction-calculation-unit', () => {
  it('선택지는 「차시당 / 출강 1회당」 두 가지 — 새로 고를 때 PER_HOUR는 보내지 않는다', () => {
    expect(SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS.map(o => o.value)).toEqual([
      'PER_CLASS',
      'PER_LECTURE',
    ])
    expect(SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS.map(o => o.label)).toEqual([
      '차시당',
      '출강 1회당',
    ])
  })

  it('서버 단위를 라벨로 복원하고 알 수 없으면 null', () => {
    expect(settlementCorrectionCalculationUnitLabel('PER_CLASS')).toBe('차시당')
    expect(settlementCorrectionCalculationUnitLabel('PER_LECTURE')).toBe('출강 1회당')
    // 레거시 「1시간 기준」(PER_HOUR)은 차시당과 같은 계산이라 같은 라벨
    expect(settlementCorrectionCalculationUnitLabel('per_hour')).toBe('차시당')
    expect(settlementCorrectionCalculationUnitLabel('SESSION')).toBeNull()
  })

  it('페이로드용 enum만 허용한다', () => {
    expect(parseSettlementCorrectionCalculationUnit('per_class')).toBe('PER_CLASS')
    expect(parseSettlementCorrectionCalculationUnit('PER_SESSION')).toBeNull()
  })
})
