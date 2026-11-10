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
        itemName: '참여자 활동비',
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
      {
        id: 166202,
        paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
        itemName: '학생 교통비',
        useYn: true,
      },
    ],
    deductionItems: [{ id: 166301, itemName: '원천징수세액', useYn: true }],
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
      PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
      PaymentItemResponsePaymentItemType.ACTIVITY,
    ])
    expect(paymentRows[0]?.iconKey).toBe('pay_transport')
    expect(paymentRows[1]?.iconKey).toBe('pay_transport')
    expect(paymentRows[2]?.iconKey).toBe('pay_activity')
    expect(paymentRows[2]?.layout).toBe('activity')
    const deduction = sections.find(s => s.kind === 'deduction')?.items[0]
    expect(deduction?.title).toBe('원천징수세액')
    expect(deduction?.description).toBe('소득 유형별 원천징수 기준과 세율을 설정합니다.')
    // API description 비었을 때 BE 시드 문구 폴백
    expect(paymentRows[0]?.description).toBe('편도 30km 이상 이동 시 지원되는 비용입니다.')
    expect(paymentRows[1]?.description).toBe('편도 30km 이상 이동 시 지원되는 비용입니다.')
    expect(paymentRows[2]?.description).toBe('활동비로 지원되는 비용입니다.')
    const wageRows = sections.find(s => s.kind === 'wage')?.items ?? []
    expect(
      wageRows.find(r => r.wageItemType === WageItemResponseWageItemType.GEMINI)?.description
    ).toBe('Gemini 프로그램에서 사용되는 강사 임금입니다.')
    expect(
      wageRows.find(r => r.wageItemType === WageItemResponseWageItemType.TIER1)?.description
    ).toBe('상세 기준에 따라 적용되는 임금입니다.')
  })

  it('API description이 있으면 Figma 폴백으로 덮지 않는다', () => {
    const sections = mapSettlementConfigToSections({
      configName: 'JA Korea 기본 정산 설정',
      paymentItems: [
        {
          id: 166201,
          paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
          itemName: '강사 교통비',
          description: '서버에서 온 설명',
          maxLimitWon: 99_000,
          useYn: true,
        },
      ],
      deductionItems: [{ id: 166301, itemName: '원천징수세액', useYn: true }],
    })
    expect(sections.find(s => s.kind === 'payment')?.items[0]?.description).toBe('서버에서 온 설명')
    expect(sections.find(s => s.kind === 'deduction')?.items[0]?.title).toBe('원천징수세액')
  })
})
