import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  readUjatWagePaymentItemValuesFromOverlay,
  resolveUjatPaymentItemIdsFromProgram,
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
