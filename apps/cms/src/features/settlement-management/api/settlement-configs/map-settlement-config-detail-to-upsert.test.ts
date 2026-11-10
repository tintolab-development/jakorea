import { describe, expect, it } from 'vitest'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'
import type { SettlementItemSettingRow } from '@/features/settlement-management/model/settlement-item-settings'
import {
  mapPaymentItemToSettingDetail,
  mapWageItemToSettingDetail,
} from './map-settlement-config-item-detail'
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
        withholdingTaxRateBusiness: 3.3,
        withholdingTaxRateOther: 0.06,
        withholdingTaxRatePrize: 4.4,
        withholdingTaxRateInterview: 22,
      },
      { title: '원천징수세액', description: '' }
    )

    expect(body.earnedIncomeDeduction).toBe(100_000)
    expect(body.smallTaxExemptionThreshold).toBe(1_000)
    const dj = JSON.parse(body.deductionItems?.[0]?.detailJson ?? '{}') as Record<string, unknown>
    expect(dj).toMatchObject({
      legacyField: 'keep-on-update',
      withholdingTaxRateBusiness: 3.3,
      withholdingTaxRateOther: 0.06,
      withholdingTaxRatePrize: 4.4,
      withholdingTaxRateInterview: 22,
    })
    expect(dj).not.toHaveProperty('withholdingTaxRateDailyWorker')
    expect(dj).not.toHaveProperty('withholdingEarnedIncomeTaxCreditRate')
    expect(body.deductionItems?.[0]?.itemName).toBe('원천징수세액')
  })

  it('원천징수 PUT itemName은 편집한 화면 제목을 보낸다', () => {
    const config = {
      configName: 'current',
      deductionItems: [
        {
          id: 166301,
          itemName: '원천징수세액',
          layout: 'withholdingDailyWorker',
          useYn: true,
          detailJson: JSON.stringify({}),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'd-166301',
      apiItemId: 166301,
      sectionKind: 'deduction',
      layout: 'withholdingDailyWorker',
      title: '원천징수세액',
      description: '소득 유형별 원천징수 기준과 세율을 설정합니다.',
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
        withholdingExclusionMaxWon: 1_000,
        withholdingTaxRateBusiness: 3.3,
        withholdingTaxRateOther: 8.8,
        withholdingTaxRatePrize: 4.4,
        withholdingTaxRateInterview: 22,
      },
      { title: '원천징수세액', description: item.description }
    )

    expect(body.deductionItems?.[0]?.itemName).toBe('원천징수세액')
  })

  it('placeholder·불릿은 PUT JSON에 넣지 않는다', () => {
    const config = {
      configName: 'current',
      paymentItems: [
        {
          id: 166205,
          paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
          itemName: '참여자 활동비',
          layout: 'activity',
          maxAmount: 1_000_000,
          maxLimitWon: 1_000_000,
          evidenceRequiredYn: true,
          taxableYn: false,
          useYn: true,
          detailJson: JSON.stringify({}),
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'p-166205',
      apiItemId: 166205,
      sectionKind: 'payment',
      paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
      title: '참여자 활동비',
      description: '',
      iconKey: 'pay_activity',
    }
    const detail = {
      ...mapPaymentItemToSettingDetail(config.paymentItems![0]!),
      qualificationLines: ['• 참여자에게 지급되는 지원비', '내용을 입력해 주세요'],
      remarkLines: ['금액', '· 실제 비고'],
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '참여자 활동비',
      description: '',
    })
    const dj = JSON.parse(body.paymentItems?.[0]?.detailJson ?? '{}') as Record<string, unknown>
    expect(dj.qualificationLines).toEqual(['참여자에게 지급되는 지원비'])
    expect(dj.remarkLines).toEqual(['실제 비고'])
    expect(body.paymentItems?.[0]?.layout).toBe('activity')
    expect(body.paymentItems?.[0]).not.toHaveProperty('qualificationLines')
  })

  it('교통비 PUT은 minOneWayKm·minDistanceKm dual-write와 commuteMode를 저장한다', () => {
    const config = {
      configName: 'current',
      paymentItems: [
        {
          id: 166201,
          paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
          itemName: '강사 교통비',
          layout: 'transport',
          evidenceRequiredYn: false,
          taxableYn: true,
          useYn: true,
          detailJson: JSON.stringify({}),
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
      basisHours: 40,
      transportCommuteMode: 'private_car' as const,
      evidenceSubmission: 'not_required' as const,
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '강사 교통비',
      description: '',
    })
    expect(JSON.parse(body.paymentItems?.[0]?.detailJson ?? '{}')).toMatchObject({
      minOneWayKm: 40,
      minDistanceKm: 40,
      transportCommuteMode: 'private_car',
    })
  })

  it('LODGING_1C1S PUT은 fixedAmountWon을 쓰고 evidenceRequiredYn=false를 유지한다', () => {
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
          detailJson: JSON.stringify({}),
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
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '숙박비 (1사1교)',
      description: '',
    })
    expect(body.paymentItems?.[0]?.evidenceRequiredYn).toBe(false)
    expect(JSON.parse(body.paymentItems?.[0]?.detailJson ?? '{}')).toMatchObject({
      fixedAmountWon: 80_000,
    })
  })

  it('Gemini 대학생 null 키는 PUT detailJson에서 생략하고 0은 유지한다', () => {
    const config = {
      configName: 'current',
      wageItems: [
        {
          id: 166106,
          wageItemType: 'GEMINI',
          name: 'Gemini 강사비',
          layout: 'gemini',
          detailJson: JSON.stringify({}),
          rateItems: [],
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'w-166106',
      apiItemId: 166106,
      sectionKind: 'wage',
      wageItemType: 'GEMINI',
      title: 'Gemini 강사비',
      description: '',
      iconKey: 'wage_gemini',
    }
    const detail = {
      layout: 'gemini' as const,
      basisUnit: '시간',
      basisHours: 1,
      compareKind: 'standard' as const,
      maxLimitWon: null,
      basicFeeWon: null,
      longDistanceFeeWon: null,
      qualificationLines: ['Gemini 프로그램에서 사용되는 강사 임금'],
      remarkLines: [],
      geminiSession1Won: 0,
      geminiSession2Won: 170_000,
      geminiSession3Won: 220_000,
      geminiSession4Won: 270_000,
      geminiSession1UniversityWon: 0,
      geminiSession2UniversityWon: 280_000,
      geminiSession3UniversityWon: 380_000,
      geminiSession4UniversityWon: null,
    }

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: 'Gemini 강사비',
      description: '',
    })
    const wage = body.wageItems?.[0]
    expect(wage?.itemName).toBe('Gemini 강사비')
    const dj = JSON.parse(wage?.detailJson ?? '{}') as Record<string, unknown>
    expect(dj.session1Won).toBe(0)
    expect(dj.session1UniversityWon).toBe(0)
    expect(dj.session4UniversityWon).toBeUndefined()
    expect(dj).not.toHaveProperty('session4UniversityWon')
  })

  it('Gemini API 지급요건이 카탈로그와 다르면 PUT에도 API 원문을 넣는다', () => {
    const apiQualification = '제미나이 프로그램에서 사용되는 강사 임금'
    const apiRemark = '서버 비고'
    const config = {
      configName: 'current',
      wageItems: [
        {
          id: 166106,
          wageItemType: 'GEMINI',
          name: '제미나이 강사비',
          layout: 'gemini',
          qualificationLines: ['Gemini 프로그램에서 사용되는 강사 임금'],
          detailJson: JSON.stringify({
            qualificationLines: [apiQualification],
            remarkLines: [apiRemark],
          }),
          rateItems: [],
        },
      ],
    } as SettlementConfigResponse
    const item: SettlementItemSettingRow = {
      id: 'w-166106',
      apiItemId: 166106,
      sectionKind: 'wage',
      wageItemType: 'GEMINI',
      title: '제미나이 강사비',
      description: '',
      iconKey: 'wage_gemini',
    }
    const detail = mapWageItemToSettingDetail(config.wageItems![0]!)

    expect(detail.qualificationLines).toEqual([apiQualification])
    expect(detail.remarkLines).toEqual([apiRemark])

    const body = buildSettlementConfigUpdateRequest(config, item, detail, {
      title: '제미나이 강사비',
      description: '',
    })
    const wage = body.wageItems?.[0]
    expect(wage?.qualificationLines).toEqual([apiQualification])
    expect(wage?.remarkLines).toEqual([apiRemark])
    const dj = JSON.parse(wage?.detailJson ?? '{}') as Record<string, unknown>
    expect(dj.qualificationLines).toEqual([apiQualification])
    expect(dj.remarkLines).toEqual([apiRemark])
  })
})

describe('buildSettlementConfigUpdateRequest 항목 제목 PUT', () => {
  const mixedConfig = {
    configName: 'current',
    wageItems: [
      {
        id: 166101,
        wageItemType: 'TIER1',
        name: '1급 강사비',
        layout: 'tier1',
        description: '임금 설명',
        detailJson: JSON.stringify({}),
      },
    ],
    paymentItems: [
      {
        id: 166201,
        paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
        itemName: '강사 교통비',
        useYn: true,
        description: '지급 설명',
        detailJson: JSON.stringify({}),
      },
    ],
    deductionItems: [
      {
        id: 166301,
        itemName: '원천징수세액',
        layout: 'withholdingDailyWorker',
        useYn: true,
        description: '공제 설명',
        detailJson: JSON.stringify({}),
      },
    ],
  } as SettlementConfigResponse

  const wageRow: SettlementItemSettingRow = {
    id: 'w-166101',
    apiItemId: 166101,
    sectionKind: 'wage',
    wageItemType: 'TIER1',
    title: '1급 강사비',
    description: '임금 설명',
    iconKey: 'wage_tier1',
  }
  const paymentRow: SettlementItemSettingRow = {
    id: 'p-166201',
    apiItemId: 166201,
    sectionKind: 'payment',
    paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
    title: '강사 교통비',
    description: '지급 설명',
    iconKey: 'pay_transport',
  }
  const deductionRow: SettlementItemSettingRow = {
    id: 'd-166301',
    apiItemId: 166301,
    sectionKind: 'deduction',
    layout: 'withholdingDailyWorker',
    title: '원천징수세액',
    description: '공제 설명',
    iconKey: 'deduct_business_33',
  }

  it('임금 항목은 GET name과 달라도 편집 제목을 PUT itemName으로 보낸다', () => {
    const wage = mixedConfig.wageItems![0]!
    const body = buildSettlementConfigUpdateRequest(
      mixedConfig,
      wageRow,
      mapWageItemToSettingDetail(wage),
      { title: '1급 강사료', description: '임금 설명 수정' }
    )
    expect(body.wageItems?.[0]?.itemName).toBe('1급 강사료')
    expect(body.wageItems?.[0]?.description).toBe('임금 설명 수정')
    expect(body.paymentItems?.[0]?.itemName).toBe('강사 교통비')
    expect(body.deductionItems?.[0]?.itemName).toBe('원천징수세액')
  })

  it('지급 항목은 편집 제목·설명을 PUT itemName·description으로 보낸다', () => {
    const payment = mixedConfig.paymentItems![0]!
    const body = buildSettlementConfigUpdateRequest(
      mixedConfig,
      paymentRow,
      mapPaymentItemToSettingDetail(payment),
      { title: '강사 교통지원비', description: '지급 설명 수정' }
    )
    expect(body.paymentItems?.[0]?.itemName).toBe('강사 교통지원비')
    expect(body.paymentItems?.[0]?.description).toBe('지급 설명 수정')
    expect(body.wageItems?.[0]?.itemName).toBe('1급 강사비')
    expect(body.deductionItems?.[0]?.itemName).toBe('원천징수세액')
  })

  it('공제 항목 저장 시 다른 항목 제목을 비우지 않는다', () => {
    const body = buildSettlementConfigUpdateRequest(
      mixedConfig,
      deductionRow,
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
        withholdingExclusionMaxWon: 1_000,
        withholdingTaxRateBusiness: 3.3,
        withholdingTaxRateOther: 8.8,
        withholdingTaxRatePrize: 4.4,
        withholdingTaxRateInterview: 22,
      },
      { title: '원천징수세액', description: '공제 설명 수정' }
    )
    expect(body.deductionItems?.[0]?.itemName).toBe('원천징수세액')
    expect(body.deductionItems?.[0]?.description).toBe('공제 설명 수정')
    expect(body.wageItems?.[0]?.itemName).toBe('1급 강사비')
    expect(body.paymentItems?.[0]?.itemName).toBe('강사 교통비')
  })
})
