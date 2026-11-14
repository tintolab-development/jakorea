import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  PROGRAM_WAGE_DEDUCTION_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import {
  readUjatWagePaymentItemValuesFromOverlay,
  resolveUjatPaymentItemIdsFromProgram,
  resolveUjatWageInfoDisplay,
  UJAT_DEFAULT_PAYMENT_ITEM_VALUES,
  UJAT_WAGE_OVERLAY_PAYMENT_KEY,
} from '@/features/program/ujat/lib/ujat-wage-info-display'

function programWith(
  overlay?: Record<string, unknown>,
  paymentItems?: string
): Program {
  return {
    id: 'ujat-wage',
    ujatRegistrationOverlay: overlay,
    generalCommonInfo: paymentItems == null ? undefined : { paymentItems },
  } as Program
}

describe('UJAT 지급 항목 — 명시적 빈값', () => {
  it('overlay에 []가 있으면 기본 교통비로 되돌리지 않는다', () => {
    const overlay = { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: [] }
    expect(readUjatWagePaymentItemValuesFromOverlay(overlay)).toEqual([])
    expect(resolveUjatPaymentItemIdsFromProgram(programWith(overlay), overlay)).toEqual([])
  })

  it('overlay 키가 없을 때 신규 폼도 지급 항목을 미리 고르지 않는다', () => {
    expect(readUjatWagePaymentItemValuesFromOverlay({})).toEqual([])
    expect(readUjatWagePaymentItemValuesFromOverlay({}, { fillDefaults: true })).toEqual([
      ...UJAT_DEFAULT_PAYMENT_ITEM_VALUES,
    ])
    expect(resolveUjatPaymentItemIdsFromProgram(programWith({}))).toEqual([])
  })

  it('프로그램 지급항목 라벨이 정본이며 overlay []로 덮지 않는다', () => {
    const overlay = { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: [] }
    expect(
      resolveUjatPaymentItemIdsFromProgram(programWith(overlay, '강사 교통비'), overlay)
    ).toEqual(expect.arrayContaining(['p-1']))
  })
})

describe('UJAT 임금 정보 조회 — settlementPolicy 기준', () => {
  it('settlementPolicy TRANSPORTATION은 카탈로그 항목명(강사 교통비), 공제는 deductionType 라벨로 보여 준다', () => {
    const display = resolveUjatWageInfoDisplay({
      id: 'ujat-wage',
      generalCommonInfo: { paymentItems: '교통비', deductionItems: PROGRAM_WAGE_DEDUCTION_LABEL },
    } as Program)
    expect(display.paymentItemsText).toBe('강사 교통비')
    expect(display.deductionItemsText).toBe(PROGRAM_WAGE_DEDUCTION_LABEL)
  })

  it('지급 항목과 임금 정책이 모두 없으면 「- / 해당없음」이다', () => {
    const display = resolveUjatWageInfoDisplay({
      id: 'ujat-wage',
      generalCommonInfo: { deductionItems: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL },
    } as Program)
    expect(display.paymentItemsText).toBe('-')
    expect(display.deductionItemsText).toBe(PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL)
  })
})
