import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SettlementConfigQueryData } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { queryClient } from '@/shared/lib/query-client'
import {
  getProgramWagePaymentItemOptions,
  normalizeOverlayPaymentItemsBeforeSubmit,
  normalizeProgramPaymentItemIds,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
  resolveProgramPaymentItemIdsFromLabels,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

vi.mock('@/features/settlement-management/hooks/use-settlement-remote-enabled', () => ({
  shouldUseSettlementRemote: () => true,
  useSettlementRemoteEnabled: () => false,
}))

function seedRemoteCatalog(
  items: Array<{ id: string; title: string; paymentItemType?: string }>
): void {
  queryClient.setQueryData<SettlementConfigQueryData>(
    settlementQueryKeys.settlementConfigs.current(),
    {
      config: {},
      sections: [
        {
          kind: 'payment',
          sectionTitle: '지급 항목',
          items: items.map(item => ({
            ...item,
            sectionKind: 'payment',
            description: '',
            iconKey: 'pay_transport',
          })),
        },
      ],
    } as SettlementConfigQueryData
  )
}

afterEach(() => {
  queryClient.clear()
})

describe('지급 항목 — 실 API 카탈로그 전용', () => {
  it('응답 전에는 mock 옵션 없이 「해당없음」만 둔다', () => {
    expect(getProgramWagePaymentItemOptions().map(o => o.value)).toEqual([
      PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
    ])
  })

  it('응답 전에는 저장값을 판정하지 않고 그대로 둔다', () => {
    expect(normalizeProgramPaymentItemIds(['p-1', 'p-3'])).toEqual(['p-1', 'p-3'])
  })

  it('예전 mock id를 항목명으로 실제 id에 교정하고, 못 찾으면 제거한다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '강사 교통비' },
      { id: 'p-166207', title: '숙박비 (1사1교)' },
    ])
    expect(getProgramWagePaymentItemOptions().map(o => o.value)).not.toContain('p-1')
    expect(normalizeProgramPaymentItemIds(['p-1', 'p-7', 'p-166201', 'p-6'])).toEqual([
      'p-166201',
      'p-166207',
    ])
  })

  it('임시저장 라벨 「숙박비 (1사1교)」를 「숙박비」가 아니라 1사1교 항목으로 되돌린다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '강사 교통비' },
      { id: 'p-166203', title: '숙박비' },
      { id: 'p-166207', title: '숙박비 (1사1교)' },
    ])
    expect(resolveProgramPaymentItemIdsFromLabels('강사 교통비, 숙박비 (1사1교)')).toEqual([
      'p-166201',
      'p-166207',
    ])
    expect(resolveProgramPaymentItemIdsFromLabels('교통비(일사일교), 숙박비(일사일교)')).toEqual([
      'p-166201',
      'p-166207',
    ])
    expect(resolveProgramPaymentItemIdsFromLabels('숙박비')).toEqual(['p-166203'])
  })

  it('응답 전 mock 매칭도 「숙박비 (1사1교)」를 1사1교 항목으로 고른다', () => {
    expect(resolveProgramPaymentItemIdsFromLabels('숙박비 (1사1교)')).toEqual(['p-7'])
  })

  it('GET 강사·학생 itemType은 카탈로그 id로 따로 켜고, TRANSPORTATION만이면 학생은 끈다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '강사 교통비', paymentItemType: 'TRANSPORT_INSTRUCTOR' },
      { id: 'p-166202', title: '학생 교통비', paymentItemType: 'TRANSPORT_STUDENT' },
      { id: 'p-166206', title: '장거리 교통비', paymentItemType: 'LONG_DISTANCE_TRANSPORTATION' },
    ])
    expect(
      resolveProgramPaymentItemIdsFromLabels([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-166201', 'p-166202'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([{ itemType: 'TRANSPORTATION', useYn: true }])
    ).toEqual(['p-166201'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([{ itemType: 'STUDENT_TRANSPORTATION', useYn: true }])
    ).toEqual(['p-166202'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([
        { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-166206'])
    expect(normalizeProgramPaymentItemIds(['p-1', '학생 교통비'])).toEqual(['p-166201', 'p-166202'])
  })

  it('강사 항목명이 교통비여도 학생 교통비를 강사 id로 접지 않는다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '교통비', paymentItemType: 'TRANSPORT_INSTRUCTOR' },
      { id: 'p-166202', title: '학생 교통비', paymentItemType: 'TRANSPORT_STUDENT' },
    ])
    expect(resolveProgramPaymentItemIdsFromLabels('학생 교통비')).toEqual(['p-166202'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([{ itemType: 'TRANSPORTATION', useYn: true }])
    ).toEqual(['p-166201'])
  })

  it('제출 직전 교정 — 하나도 못 찾으면 재선택 대상으로 알린다', async () => {
    seedRemoteCatalog([{ id: 'p-166201', title: '강사 교통비' }])
    const result = await normalizeOverlayPaymentItemsBeforeSubmit(
      {
        'generalRegistration.wageInfo.paymentItemValues': ['p-1'],
        'economyRegistration.wageInfo.paymentItemValues': ['p-6'],
      },
      [
        {
          valuesKey: 'generalRegistration.wageInfo.paymentItemValues',
          labelsKey: 'generalRegistration.wageInfo.paymentItemLabels',
        },
        { valuesKey: 'economyRegistration.wageInfo.paymentItemValues' },
      ]
    )
    expect(result.patch).toEqual({
      'generalRegistration.wageInfo.paymentItemValues': ['p-166201'],
      'generalRegistration.wageInfo.paymentItemLabels': '강사 교통비',
      'economyRegistration.wageInfo.paymentItemValues': [],
    })
    expect(result.clearedKeys).toEqual(['economyRegistration.wageInfo.paymentItemValues'])
  })
})
