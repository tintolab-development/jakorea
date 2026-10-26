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

  it('원천징수 설정의 퍼센트·금액 단위를 그대로 저장하고 상위 동기화 필드를 유지한다', () => {
    const config = {
      configName: 'current',
      earnedIncomeDeduction: 100_000,
      smallTaxExemptionThreshold: 1_000,
      deductionItems: [
        {
          id: 166301,
          itemName: '원천징수',
          layout: 'withholdingDailyWorker',
          detailJson: JSON.stringify({
            withholdingEarnedIncomeDeductionWon: 100_000,
            withholdingExclusionMaxWon: 1_000,
            withholdingTaxRateBusiness: 3.3,
            withholdingTaxRateOther: 0.06,
          }),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'd-166301',
      apiItemId: 166301,
      sectionKind: 'deduction',
      title: '원천징수',
      description: '',
      iconKey: 'deduct_business_33',
    }

    const body = buildSettlementConfigUpdateRequest(
      config,
      item,
      {
        layout: 'withholdingDailyWorker',
        basisUnit: '전체',
        basisHours: 1,
        compareKind: 'standard',
        maxLimitWon: null,
        basicFeeWon: null,
        longDistanceFeeWon: null,
        qualificationLines: [],
        remarkLines: [],
        withholdingEarnedIncomeDeductionWon: 100_000,
        withholdingExclusionMaxWon: 1_000,
        withholdingTaxRateBusiness: 3.3,
        withholdingTaxRateOther: 0.06,
      },
      { title: '원천징수', description: '' }
    )

    expect(body.earnedIncomeDeduction).toBe(100_000)
    expect(body.smallTaxExemptionThreshold).toBe(1_000)
    expect(JSON.parse(body.deductionItems?.[0]?.detailJson ?? '{}')).toMatchObject({
      withholdingTaxRateBusiness: 3.3,
      withholdingTaxRateOther: 0.06,
    })
  })
})
