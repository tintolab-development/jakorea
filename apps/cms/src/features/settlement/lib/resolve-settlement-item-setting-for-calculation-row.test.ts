import { describe, expect, it } from 'vitest'
import {
  findSettlementItemSettingByTitle,
  mapSettlementFrontendItemTypeToLineKind,
  resolveSettlementItemSettingForCalculationRow,
} from './resolve-settlement-item-setting-for-calculation-row'
import type { PaymentOrderCalculationTableRow } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'

function mockRow(
  overrides: Partial<PaymentOrderCalculationTableRow>
): PaymentOrderCalculationTableRow {
  return {
    key: '0-1',
    blockRowSpan: 1,
    isFirstInBlock: true,
    institutionName: '테스트학교',
    lectureDateDisplay: '2026. 01. 01(목)',
    lectureSessionDisplay: '1 ~ 2차시',
    itemLabel: '강의비',
    description: 'desc',
    amount: 100000,
    lineId: 'line-1',
    kind: 'lecture_fee',
    ...overrides,
  }
}

describe('resolveSettlementItemSettingForCalculationRow', () => {
  it('강의비 행 + 강의비 책정 기준 → 해당 등급 임금 항목', () => {
    const row = mockRow({ itemLabel: '강의비', kind: 'lecture_fee' })
    const item = resolveSettlementItemSettingForCalculationRow(row, {
      lectureFeeStandardTitle: '2급 강사비',
    })
    expect(item?.id).toBe('w-2')
    expect(item?.title).toBe('2급 강사비')
  })

  it('교통비 행은 정산 항목 설정 모달 대상 아님', () => {
    const row = mockRow({ itemLabel: '교통비', kind: 'travel', amount: 30000 })
    expect(resolveSettlementItemSettingForCalculationRow(row)).toBeNull()
  })

  it('원천징수 행 → 공제 항목', () => {
    const row = mockRow({
      itemLabel: '원천징수',
      kind: 'withholding',
      amount: -8800,
    })
    expect(resolveSettlementItemSettingForCalculationRow(row)?.id).toBe('d-1')
  })
})

describe('findSettlementItemSettingByTitle', () => {
  it('1급 강사비 id', () => {
    expect(findSettlementItemSettingByTitle('1급 강사비')?.id).toBe('w-1')
  })
})

describe('mapSettlementFrontendItemTypeToLineKind', () => {
  it('API type → line kind', () => {
    expect(mapSettlementFrontendItemTypeToLineKind('transportation', 100)).toBe('travel')
    expect(mapSettlementFrontendItemTypeToLineKind('accommodation', 100)).toBe('lodging')
    expect(mapSettlementFrontendItemTypeToLineKind('withholding', -100)).toBe('withholding')
    expect(mapSettlementFrontendItemTypeToLineKind('instructor_fee', 100)).toBe('lecture_fee')
    expect(mapSettlementFrontendItemTypeToLineKind('meal', 15000)).toBe('meal')
    expect(mapSettlementFrontendItemTypeToLineKind('activity', 20000)).toBe('activity')
  })
})
