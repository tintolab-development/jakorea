import { describe, expect, it } from 'vitest'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import { WageItemResponseWageItemType } from '@/shared/api/generated/settlement/schemas/wageItemResponseWageItemType'
import {
  mapDeductionItemToSettingDetail,
  mapPaymentItemToSettingDetail,
  mapWageItemToSettingDetail,
} from './map-settlement-config-item-detail'

describe('mapWageItemToSettingDetail', () => {
  it('GET에 지급요건·비고·한도가 없으면 1급 카탈로그 기본값을 채운다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 1,
      wageItemType: WageItemResponseWageItemType.TIER1,
      name: '1급 강사비',
      description: '상세 기준에 따라 적용되는 임금입니다.',
      layout: 'tier1',
    })

    expect(detail.layout).toBe('tier1')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.qualificationLines).toEqual([])
    expect(detail.remarkLines).toEqual([])
  })

  it('flat 필드가 있으면 카탈로그를 덮어쓰지 않는다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      basisHours: 2,
      maxLimitWon: 123_000,
      qualificationLines: ['서버 지급 요건'],
      remarkLines: ['서버 비고'],
    })

    expect(detail.basisHours).toBe(2)
    expect(detail.maxLimitWon).toBe(123_000)
    expect(detail.qualificationLines).toEqual(['서버 지급 요건'])
    expect(detail.remarkLines).toEqual(['서버 비고'])
  })

  it('detailJson 객체·문자열에서 지급요건·한도를 읽는다', () => {
    const fromObject = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      detailJson: {
        qualificationLines: ['JSON 요건'],
        remarkLines: ['JSON 비고'],
        maxLimitWon: 500_000,
      } as unknown as string,
    })
    expect(fromObject.qualificationLines).toEqual(['JSON 요건'])
    expect(fromObject.remarkLines).toEqual(['JSON 비고'])
    expect(fromObject.maxLimitWon).toBe(500_000)

    const fromString = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      detailJson: JSON.stringify({
        qualificationLines: ['문자 JSON 요건'],
        remarkLines: ['문자 JSON 비고'],
        maxLimitWon: 400_000,
      }),
    })
    expect(fromString.qualificationLines).toEqual(['문자 JSON 요건'])
    expect(fromString.maxLimitWon).toBe(400_000)
  })

  it('maxLimitWon이 없으면 amount를 한도로 쓴다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      amount: 500_000,
      qualificationLines: ['요건'],
      remarkLines: ['비고'],
    })
    expect(detail.maxLimitWon).toBe(500_000)
  })
})

describe('mapPaymentItemToSettingDetail', () => {
  it('증빙 정책은 evidenceRequiredYn을 쓰고 detailJson.evidenceSubmission은 무시한다', () => {
    const notRequired = mapPaymentItemToSettingDetail({
      id: 166201,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      itemName: '강사 교통비',
      evidenceRequiredYn: false,
      taxableYn: true,
      useYn: true,
      detailJson: JSON.stringify({ evidenceSubmission: 'required' }),
    })
    expect(notRequired.evidenceSubmission).toBe('not_required')

    const required = mapPaymentItemToSettingDetail({
      id: 166202,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
      itemName: '학생 교통비',
      evidenceRequiredYn: true,
      taxableYn: false,
      useYn: true,
      detailJson: JSON.stringify({ evidenceSubmission: 'not_required' }),
    })
    expect(required.evidenceSubmission).toBe('required')
  })

  it('evidenceRequiredYn이 없으면 미설정으로 두고 false로 대체하지 않는다', () => {
    const unconfigured = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      itemName: '식사비',
      detailJson: JSON.stringify({ evidenceSubmission: 'required' }),
    })
    expect(unconfigured.evidenceSubmission).toBeUndefined()
  })

  it('식사비의 layout·최대 한도·증빙 정책을 서버 응답 그대로 매핑한다', () => {
    const meal = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      itemName: '식사비',
      layout: 'meal',
      maxAmount: 1_000_000,
      evidenceRequiredYn: false,
    })

    expect(meal.layout).toBe('meal')
    expect(meal.maxLimitWon).toBe(1_000_000)
    expect(meal.evidenceSubmission).toBe('not_required')
  })

  it.each([
    [PaymentItemResponsePaymentItemType.LODGING_GENERAL, 150_000, true],
    [PaymentItemResponsePaymentItemType.LODGING_1C1S, 80_000, false],
  ])('숙박비 %s는 API 유형별 한도·증빙과 박 기준을 매핑한다', (paymentItemType, maxAmount, evidence) => {
    const detail = mapPaymentItemToSettingDetail({
      paymentItemType,
      itemName: paymentItemType === 'LODGING_1C1S' ? '숙박비 (1사1교)' : '숙박비',
      layout: 'lodging',
      maxAmount,
      evidenceRequiredYn: evidence,
      taxableYn: paymentItemType === 'LODGING_1C1S',
      detailJson: JSON.stringify({ basisUnit: '일', basisHours: 2 }),
    })

    expect(detail.layout).toBe('lodging')
    expect(detail.basisUnit).toBe('박')
    expect(detail.basisHours).toBe(2)
    expect(detail.maxLimitWon).toBe(maxAmount)
    expect(detail.evidenceSubmission).toBe(evidence ? 'required' : 'not_required')
  })

  it('활동비 layout은 식사비로 변환하지 않고 활동비 모달 분기를 유지한다', () => {
    const activity = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
      itemName: '활동비',
      layout: 'volunteerActivity',
      maxAmount: 1_000_000,
      evidenceRequiredYn: true,
    })

    expect(activity.layout).toBe('volunteerActivity')
    expect(activity.maxLimitWon).toBe(1_000_000)
    expect(activity.evidenceSubmission).toBe('required')
  })
})

describe('mapDeductionItemToSettingDetail', () => {
  it('원천징수 서버 값이 없으면 기획 기본값을 표시한다', () => {
    const detail = mapDeductionItemToSettingDetail({
      id: 166301,
      itemName: '원천징수',
      layout: 'withholdingDailyWorker',
      detailJson: JSON.stringify({}),
    })

    expect(detail.qualificationLines).toEqual([
      '1일 급여액에서 근로소득공제 150,000원을 차감하여 산정',
    ])
    expect(detail.withholdingExclusionMaxWon).toBe(1_000)
    expect(detail.withholdingEarnedIncomeDeductionWon).toBe(150_000)
    expect(detail.withholdingTaxRateDailyWorker).toBe(6)
    expect(detail.withholdingTaxRateBusiness).toBe(3.3)
    expect(detail.withholdingTaxRateOther).toBe(8.8)
    expect(detail.withholdingTaxRatePrize).toBe(4.4)
    expect(detail.withholdingTaxRateInterview).toBe(22)
    expect(detail.withholdingEarnedIncomeTaxCreditRate).toBe(55)
  })

  it('원천징수 서버 값이 있으면 기본값보다 우선하고 미지정 필드를 보존한다', () => {
    const detail = mapDeductionItemToSettingDetail({
      id: 166301,
      itemName: '원천징수',
      layout: 'withholdingDailyWorker',
      detailJson: JSON.stringify({
        qualificationLines: ['서버 요건'],
        withholdingExclusionMaxWon: 1_200,
        withholdingEarnedIncomeDeductionWon: 160_000,
        withholdingTaxRateDailyWorker: 5.5,
        withholdingTaxRateBusiness: 4.1,
        withholdingTaxRateOther: 9.9,
        withholdingTaxRatePrize: 4.5,
        withholdingTaxRateInterview: 21,
        withholdingEarnedIncomeTaxCreditRate: 50,
        legacyField: 'keep-on-read',
      }),
    })

    expect(detail.qualificationLines).toEqual(['서버 요건'])
    expect(detail.withholdingExclusionMaxWon).toBe(1_200)
    expect(detail.withholdingEarnedIncomeDeductionWon).toBe(160_000)
    expect(detail.withholdingTaxRateDailyWorker).toBe(5.5)
    expect(detail.withholdingTaxRateBusiness).toBe(4.1)
    expect(detail.withholdingTaxRateOther).toBe(9.9)
    expect(detail.withholdingTaxRatePrize).toBe(4.5)
    expect(detail.withholdingTaxRateInterview).toBe(21)
    expect(detail.withholdingEarnedIncomeTaxCreditRate).toBe(50)
  })

  it('detailJson에 금액이 없으면 서버 상위 설정 값을 사용한다', () => {
    const detail = mapDeductionItemToSettingDetail(
      {
        id: 166301,
        itemName: '원천징수',
        layout: 'withholdingDailyWorker',
        detailJson: JSON.stringify({}),
      },
      { earnedIncomeDeduction: 170_000, smallTaxExemptionThreshold: 1_100 }
    )

    expect(detail.withholdingEarnedIncomeDeductionWon).toBe(170_000)
    expect(detail.withholdingExclusionMaxWon).toBe(1_100)
  })

  it('서버가 명시한 null은 기획 기본값으로 치환하지 않는다', () => {
    const detail = mapDeductionItemToSettingDetail({
      id: 166301,
      itemName: '원천징수',
      layout: 'withholdingDailyWorker',
      detailJson: JSON.stringify({
        withholdingTaxRateDailyWorker: null,
        withholdingEarnedIncomeTaxCreditRate: null,
      }),
    })

    expect(detail.withholdingTaxRateDailyWorker).toBeNull()
    expect(detail.withholdingEarnedIncomeTaxCreditRate).toBeNull()
  })
})
