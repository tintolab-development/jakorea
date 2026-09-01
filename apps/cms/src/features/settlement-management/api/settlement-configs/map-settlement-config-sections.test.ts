import { describe, expect, it } from 'vitest'
import { mapSettlementConfigToSections } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-sections'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import { WageItemResponseWageItemType } from '@/shared/api/generated/settlement/schemas/wageItemResponseWageItemType'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

function v2Config(): SettlementConfigResponse {
  return {
    configName: 'JA Korea 기본 정산 설정',
    wageItems: [
      { id: 166106, wageItemType: WageItemResponseWageItemType.GEMINI, name: '제미나이 강사비' },
      { id: 166101, wageItemType: WageItemResponseWageItemType.TIER1, name: '1급 강사비' },
    ],
    paymentItems: [
      {
        id: 166207,
        paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
        itemName: '활동비',
        layout: 'meal',
        maxLimitWon: 50_000,
        useYn: true,
      },
      {
        id: 166201,
        paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
        itemName: '강사 교통비',
        useYn: true,
      },
    ],
    deductionItems: [{ id: 166301, itemName: '일용근로자 원천징수세액', useYn: true }],
  }
}

describe('mapSettlementConfigToSections', () => {
  it('wageItemType·paymentItemType enum 순서로 정렬하고 heuristic 없이 iconKey를 매핑한다', () => {
    const sections = mapSettlementConfigToSections(v2Config())
    const wageTitles = sections.find(s => s.kind === 'wage')?.items.map(i => i.title)
    const paymentRows = sections.find(s => s.kind === 'payment')?.items ?? []

    expect(wageTitles).toEqual(['1급 강사비', '제미나이 강사비'])
    expect(paymentRows.map(row => row.paymentItemType)).toEqual([
      PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      PaymentItemResponsePaymentItemType.ACTIVITY,
    ])
    expect(paymentRows[0]?.iconKey).toBe('pay_transport')
    expect(paymentRows[1]?.iconKey).toBe('pay_activity')
    expect(paymentRows[1]?.layout).toBe('meal')
  })
})
