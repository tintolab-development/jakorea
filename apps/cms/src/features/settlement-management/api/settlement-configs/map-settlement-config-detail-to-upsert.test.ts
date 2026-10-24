import { describe, expect, it } from 'vitest'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'
import type { SettlementItemSettingRow } from '@/features/settlement-management/model/settlement-item-settings'
import { mapPaymentItemToSettingDetail } from './map-settlement-config-item-detail'
import { buildSettlementConfigUpdateRequest } from './map-settlement-config-detail-to-upsert'

describe('buildSettlementConfigUpdateRequest payment evidenceRequiredYn', () => {
  it('지급 항목 저장 시 evidenceRequiredYn을 명시하고 taxableYn으로 대체하지 않는다', () => {
    const config = {
      configName: 'current',
      paymentItems: [
        {
          id: 166201,
          paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
          itemName: '강사 교통비',
          evidenceRequiredYn: true,
          taxableYn: true,
          useYn: true,
          detailJson: JSON.stringify({ evidenceSubmission: 'required' }),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'p-166201',
      apiItemId: 166201,
      sectionKind: 'payment',
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      title: '강사 교통비',
      description: '',
      iconKey: 'pay_transport',
    }
    const detail = {
      ...mapPaymentItemToSettingDetail(config.paymentItems![0]!),
      evidenceSubmission: 'not_required' as const,
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '강사 교통비',
      description: '',
    })

    expect(body.paymentItems?.[0]?.evidenceRequiredYn).toBe(false)
    expect(body.paymentItems?.[0]?.taxableYn).toBe(true)
  })
})
