import { describe, expect, it } from 'vitest'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'
import { isPaymentItemCalculationBasisWithSiblings } from './payment-item-calculation-basis'

const config = {
  paymentItems: [
    { id: 166203, paymentItemType: 'LODGING_GENERAL', itemName: '숙박비', useYn: true },
    { id: 166213, paymentItemType: 'LODGING_GENERAL', itemName: '숙박비 (복사본)', useYn: true },
    { id: 166209, paymentItemType: 'LODGING_GENERAL', itemName: '숙박비 (복사본)', useYn: false },
    { id: 166205, paymentItemType: 'MEAL', itemName: '식사비', useYn: true },
  ],
} as SettlementConfigResponse

describe('isPaymentItemCalculationBasisWithSiblings', () => {
  it('같은 유형의 다른 활성 항목이 있을 때 가장 먼저 만든 항목이면 true', () => {
    expect(isPaymentItemCalculationBasisWithSiblings(config, 166203)).toBe(true)
  })

  it('복제본은 false', () => {
    expect(isPaymentItemCalculationBasisWithSiblings(config, 166213)).toBe(false)
  })

  it('같은 유형에 활성 항목이 하나뿐이면 false (비활성 항목은 세지 않음)', () => {
    expect(isPaymentItemCalculationBasisWithSiblings(config, 166205)).toBe(false)
    expect(
      isPaymentItemCalculationBasisWithSiblings(
        { paymentItems: [config.paymentItems![0], config.paymentItems![2]] },
        166203
      )
    ).toBe(false)
  })

  it('설정이 없거나 id가 목록에 없으면 false', () => {
    expect(isPaymentItemCalculationBasisWithSiblings(undefined, 166203)).toBe(false)
    expect(isPaymentItemCalculationBasisWithSiblings(config, 999)).toBe(false)
  })
})
