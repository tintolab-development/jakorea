import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SettlementConfigQueryData } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { queryClient } from '@/shared/lib/query-client'
import {
  getProgramWagePaymentItemOptions,
  normalizeOverlayPaymentItemsBeforeSubmit,
  normalizeProgramPaymentItemIds,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

vi.mock('@/features/settlement-management/hooks/use-settlement-remote-enabled', () => ({
  shouldUseSettlementRemote: () => true,
  useSettlementRemoteEnabled: () => false,
}))

function seedRemoteCatalog(items: Array<{ id: string; title: string }>): void {
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
