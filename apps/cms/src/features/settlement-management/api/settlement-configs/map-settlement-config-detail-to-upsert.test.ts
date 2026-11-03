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

  it('식사비의 최대 한도·증빙 설정과 기존 detailJson을 함께 저장한다', () => {
    const config = {
      configName: 'current',
      paymentItems: [
        {
          id: 166204,
          paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
          itemName: '식사비',
          layout: 'meal',
          maxAmount: 500_000,
          maxLimitWon: 500_000,
          evidenceRequiredYn: true,
          taxableYn: true,
          useYn: true,
          detailJson: JSON.stringify({ legacyField: 'keep-on-update' }),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'p-166204',
      apiItemId: 166204,
      sectionKind: 'payment',
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      title: '식사비',
      description: '',
      iconKey: 'pay_meal',
    }
    const detail = {
      ...mapPaymentItemToSettingDetail(config.paymentItems![0]!),
      maxLimitWon: 1_000_000,
      evidenceSubmission: 'not_required' as const,
      qualificationLines: ['변경된 지급 요건'],
      remarkLines: ['변경된 비고'],
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '식사비',
      description: '',
    })
    const saved = body.paymentItems?.[0]

    expect(saved?.maxAmount).toBe(1_000_000)
    expect(saved?.maxLimitWon).toBe(1_000_000)
    expect(saved?.evidenceRequiredYn).toBe(false)
    expect(JSON.parse(saved?.detailJson ?? '{}')).toMatchObject({
      legacyField: 'keep-on-update',
      qualificationLines: ['변경된 지급 요건'],
      remarkLines: ['변경된 비고'],
      evidenceSubmission: 'not_required',
    })
  })

  it('숙박비 유형별 증빙 설정을 저장하되 과세 여부는 서버 값을 유지한다', () => {
    const config = {
      configName: 'current',
      paymentItems: [
        {
          id: 166207,
          paymentItemType: PaymentItemResponsePaymentItemType.LODGING_1C1S,
          itemName: '숙박비 (1사1교)',
          layout: 'lodging',
          maxAmount: 80_000,
          maxLimitWon: 80_000,
          evidenceRequiredYn: false,
          taxableYn: true,
          useYn: true,
          detailJson: JSON.stringify({ basisUnit: '박', basisHours: 1 }),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'p-166207',
      apiItemId: 166207,
      sectionKind: 'payment',
      paymentItemType: PaymentItemResponsePaymentItemType.LODGING_1C1S,
      title: '숙박비 (1사1교)',
      description: '',
      iconKey: 'pay_lodging',
    }
    const detail = {
      ...mapPaymentItemToSettingDetail(config.paymentItems![0]!),
      maxLimitWon: 80_000,
      evidenceSubmission: 'not_required' as const,
      basisUnit: '박',
      basisHours: 2,
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '숙박비 (1사1교)',
      description: '',
    })
    const saved = body.paymentItems?.[0]

    expect(saved?.paymentItemType).toBe(PaymentItemResponsePaymentItemType.LODGING_1C1S)
    expect(saved?.maxAmount).toBe(80_000)
    expect(saved?.evidenceRequiredYn).toBe(false)
    expect(saved?.taxableYn).toBe(true)
    expect(JSON.parse(saved?.detailJson ?? '{}')).toMatchObject({
      basisUnit: '박',
      basisHours: 2,
    })
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
            legacyField: 'keep-on-update',
            withholdingEarnedIncomeDeductionWon: 100_000,
            withholdingExclusionMaxWon: 1_000,
            withholdingTaxRateDailyWorker: 6,
            withholdingTaxRateBusiness: 3.3,
            withholdingTaxRateOther: 0.06,
            withholdingEarnedIncomeTaxCreditRate: 55,
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
        withholdingTaxRateDailyWorker: 6,
        withholdingTaxRateBusiness: 3.3,
        withholdingTaxRateOther: 0.06,
        withholdingEarnedIncomeTaxCreditRate: 55,
      },
      { title: '원천징수', description: '' }
    )

    expect(body.earnedIncomeDeduction).toBe(100_000)
    expect(body.smallTaxExemptionThreshold).toBe(1_000)
    expect(JSON.parse(body.deductionItems?.[0]?.detailJson ?? '{}')).toMatchObject({
      legacyField: 'keep-on-update',
      withholdingTaxRateDailyWorker: 6,
      withholdingTaxRateBusiness: 3.3,
      withholdingTaxRateOther: 0.06,
      withholdingEarnedIncomeTaxCreditRate: 55,
    })
  })
})
