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
    expect(detail.basisUnit).toBe('시간')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBe(500_000)
    expect(detail.qualificationLines).toEqual([
      '해당분야 최고의 전문가',
      '전·현직 장관(급) 및 대학총장(급)',
      '전·현직 국회의원, 대기업 총수, 국영기업체',
      '정부 출연 연구기관장, 기업·기관, 단체의 장',
      '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
    ])
    expect(detail.remarkLines).toEqual([
      '유급의 내부직원에게는 지급 불가',
      '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
    ])
  })

  it('GET에 지급요건·비고·한도가 없으면 2급 카탈로그 기본값을 채운다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 2,
      wageItemType: WageItemResponseWageItemType.TIER2,
      name: '2급 강사비',
      description: '상세 기준에 따라 적용되는 임금입니다.',
      layout: 'tier1',
    })

    expect(detail.layout).toBe('tier1')
    expect(detail.basisUnit).toBe('시간')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBe(400_000)
    expect(detail.qualificationLines).toEqual([
      '해당분야 최고의 전문가',
      '차관(급)',
      '대학교의 조교수 및 부교수 이상, 연구기관의 연구위원급',
      '판검사 및 변호사, 공인회계사 등 전문자격증을 가진 자',
      '언론인(부장급 이상)',
      '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
    ])
    expect(detail.remarkLines).toEqual([
      '유급의 내부직원에게는 지급 불가',
      '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
    ])
  })

  it('GET에 지급요건·비고·한도가 없으면 3급 카탈로그 기본값을 채운다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 3,
      wageItemType: WageItemResponseWageItemType.TIER3,
      name: '3급 강사비',
      description: '일반적으로 사용되는 강사 임금입니다.',
      layout: 'tier1',
    })

    expect(detail.layout).toBe('tier1')
    expect(detail.basisUnit).toBe('시간')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBe(300_000)
    expect(detail.qualificationLines).toEqual([
      '해당분야 최고의 전문가',
      '4급 이상 공무원, 박사학위 소지 5급 이하 공무원 및 전직 재단 임원',
      '대학교의 조교수·강사, 연구기관의 연구원 등',
      '사회 통념상 상기 자격에 준하는 자로서 교육운영상 사무총장이 인정하는 자',
    ])
    expect(detail.remarkLines).toEqual([
      '유급의 내부직원에게는 지급 불가',
      '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
    ])
  })

  it('GET에 지급요건·비고가 없으면 특강 카탈로그 기본값을 채우고 산정기준 숫자는 두지 않는다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 4,
      wageItemType: WageItemResponseWageItemType.SPECIAL_LECTURE,
      name: '특강 강사비',
      description: '금액 한도가 별도 적용되는 임금입니다.',
      layout: 'specialLecture',
    })

    expect(detail.layout).toBe('specialLecture')
    expect(detail.basisUnit).toBe('전체')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.basicFeeWon).toBeNull()
    expect(detail.longDistanceFeeWon).toBeNull()
    expect(detail.qualificationLines).toEqual(['국내외 해당 분야 최고 권위자로 총장이 인정하는 자'])
    expect(detail.remarkLines).toEqual([
      '유급의 내부직원에게는 지급 불가',
      '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
    ])
  })

  it('GET에 값이 없어도 기타 인건비는 specialLecture·빈 placeholder·산정기준 숫자 없음', () => {
    const detail = mapWageItemToSettingDetail({
      id: 5,
      wageItemType: WageItemResponseWageItemType.OTHER_LABOR,
      name: '기타 인건비',
      description: '금액 한도가 별도 적용되는 임금입니다.',
      layout: 'specialLecture',
    })

    expect(detail.layout).toBe('specialLecture')
    expect(detail.basisUnit).toBe('전체')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.basicFeeWon).toBeNull()
    expect(detail.longDistanceFeeWon).toBeNull()
    expect(detail.qualificationLines).toEqual([])
    expect(detail.remarkLines).toEqual([])
  })

  it('GET에 없으면 Gemini 카탈로그를 채우고 1차시 0과 4차시 대학생 blank를 구분한다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 6,
      wageItemType: WageItemResponseWageItemType.GEMINI,
      name: 'Gemini 강사비',
      description: 'Gemini 프로그램에서 사용되는 강사 임금입니다.',
      layout: 'gemini',
    })

    expect(detail.layout).toBe('gemini')
    expect(detail.qualificationLines).toEqual(['Gemini 프로그램에서 사용되는 강사 임금'])
    expect(detail.remarkLines).toEqual([
      '실적보고서를 기반으로 차시 산출하여 금액 산정',
      '별도의 지급조서 작성 및 확인 절차 없이 계좌 지급 대상 목록으로 노출 및 처리',
    ])
    expect(detail.geminiSession1Won).toBe(0)
    expect(detail.geminiSession1UniversityWon).toBe(0)
    expect(detail.geminiSession2Won).toBe(170_000)
    expect(detail.geminiSession2UniversityWon).toBe(280_000)
    expect(detail.geminiSession3Won).toBe(220_000)
    expect(detail.geminiSession3UniversityWon).toBe(380_000)
    expect(detail.geminiSession4Won).toBe(270_000)
    expect(detail.geminiSession4UniversityWon).toBeNull()
  })

  it('Gemini API 지급요건·비고가 카탈로그와 다르면 detailJson 원문을 쓴다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 166106,
      wageItemType: WageItemResponseWageItemType.GEMINI,
      name: '제미나이 강사비',
      layout: 'gemini',
      qualificationLines: ['Gemini 프로그램에서 사용되는 강사 임금'],
      remarkLines: ['카탈로그 비고'],
      detailJson: JSON.stringify({
        qualificationLines: ['제미나이 프로그램에서 사용되는 강사 임금'],
        remarkLines: ['서버 비고'],
      }),
    })

    expect(detail.qualificationLines).toEqual(['제미나이 프로그램에서 사용되는 강사 임금'])
    expect(detail.remarkLines).toEqual(['서버 비고'])
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

  it('API session1Won 0은 유효값이라 카탈로그로 덮어쓰지 않는다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.GEMINI,
      name: 'Gemini 강사비',
      layout: 'gemini',
      detailJson: JSON.stringify({
        session1Won: 0,
        session2Won: 111_000,
        session3Won: 222_000,
        session4Won: 333_000,
      }),
      rateItems: [
        { unitCount: 1, amount: 0 },
        { unitCount: 2, amount: 111_000 },
        { unitCount: 3, amount: 222_000 },
        { unitCount: 4, amount: 333_000 },
      ],
    })

    expect(detail.geminiSession1Won).toBe(0)
    expect(detail.geminiSession2Won).toBe(111_000)
    expect(detail.geminiSession3Won).toBe(222_000)
    expect(detail.geminiSession4Won).toBe(333_000)
  })

  it('지급요건 배열 길이가 0보다 크면 카탈로그를 덮어쓴다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      name: '1급 강사비',
      layout: 'tier1',
      qualificationLines: ['• API 요건'],
      remarkLines: ['내용을 입력해 주세요', '실제 비고'],
    })

    expect(detail.qualificationLines).toEqual(['API 요건'])
    expect(detail.remarkLines).toEqual(['실제 비고'])
  })
})

describe('mapPaymentItemToSettingDetail', () => {
  it('GET에 없으면 강사 교통비 카탈로그(30km·자차·불필요·disabled용 기본)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 7,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      itemName: '강사 교통비',
      layout: 'transport',
    })

    expect(detail.layout).toBe('transport')
    expect(detail.basisUnit).toBe('거리')
    expect(detail.basisHours).toBe(30)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.transportCommuteMode).toBe('private_car')
    expect(detail.evidenceSubmission).toBe('not_required')
    expect(detail.qualificationLines).toEqual([
      '네이버 지도를 기준으로, 입력된 강사 자택 주소 및 강의 장소 기준으로 거리 및 유류비와 톨비가 고려된 금액 자동 산출',
    ])
    expect(detail.remarkLines).toEqual([
      '실비 영수증이 없을 경우 강사 교통비를 지급하지 않는 것이 원칙이나, 팀별 판단에 따라 편도 교통비 영수증만으로도 왕복 교통비를 지급',
    ])
  })

  it('GET에 없으면 학생 교통비 카탈로그(30km·대중교통·필요·disabled용 기본)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 8,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
      itemName: '학생 교통비',
      layout: 'transport',
    })

    expect(detail.layout).toBe('transport')
    expect(detail.basisUnit).toBe('거리')
    expect(detail.basisHours).toBe(30)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.transportCommuteMode).toBe('public_transit')
    expect(detail.evidenceSubmission).toBe('required')
    expect(detail.qualificationLines).toEqual([
      '대중교통 이용비(KTX일반, 고속버스, 전세버스 등)',
      '톨비의 경우, 별도 영수증 증빙 처리해서 산출',
    ])
    expect(detail.remarkLines).toEqual(['실비 영수증 필수 제출'])
  })

  it('GET에 없으면 숙박비(LODGING_GENERAL) 카탈로그(1박·150,000·필요·비고 blank)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 9,
      paymentItemType: PaymentItemResponsePaymentItemType.LODGING_GENERAL,
      itemName: '숙박비',
      layout: 'lodging',
    })

    expect(detail.layout).toBe('lodging')
    expect(detail.basisUnit).toBe('박')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBe(150_000)
    expect(detail.evidenceSubmission).toBe('required')
    expect(detail.qualificationLines).toEqual(['1인 1실 기준'])
    expect(detail.remarkLines).toEqual([])
  })

  it('GET에 없으면 숙박비(1사1교) 카탈로그(지급액 80,000·불필요·세금 비고)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 10,
      paymentItemType: PaymentItemResponsePaymentItemType.LODGING_1C1S,
      itemName: '숙박비 (1사1교)',
      layout: 'lodging',
    })

    expect(detail.layout).toBe('lodging')
    expect(detail.basisUnit).toBe('박')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBe(80_000)
    expect(detail.evidenceSubmission).toBe('not_required')
    expect(detail.qualificationLines).toEqual(['숙박비 고정 지급'])
    expect(detail.remarkLines).toEqual(['영수증 제출 없음. 세금 징수.'])
  })

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

  it('evidenceRequiredYn이 없으면(카탈로그 증빙 없는 유형) 미설정으로 두고 false로 대체하지 않는다', () => {
    const unconfigured = mapPaymentItemToSettingDetail({
      paymentItemType: 'UNKNOWN_PAYMENT' as PaymentItemResponsePaymentItemType,
      itemName: '미지정',
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

  it('GET에 없으면 식사비(MEAL) 카탈로그(30,000·필요·비고 blank·단위행 없음 layout)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 11,
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      itemName: '식사비',
      layout: 'meal',
    })

    expect(detail.layout).toBe('meal')
    expect(detail.maxLimitWon).toBe(30_000)
    expect(detail.evidenceSubmission).toBe('required')
    expect(detail.qualificationLines).toEqual(['1인 1식 기준'])
    expect(detail.remarkLines).toEqual([])
  })

  it.each([
    [PaymentItemResponsePaymentItemType.LODGING_GENERAL, 150_000, true],
    [PaymentItemResponsePaymentItemType.LODGING_1C1S, 80_000, false],
  ])(
    '숙박비 %s는 API 유형별 한도·증빙과 박 기준을 매핑한다',
    (paymentItemType, maxAmount, evidence) => {
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
    }
  )

  it('활동비 layout은 activity로 유지한다', () => {
    const activity = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
      itemName: '활동비',
      layout: 'activity',
      maxAmount: 1_000_000,
      evidenceRequiredYn: true,
    })

    expect(activity.layout).toBe('activity')
    expect(activity.maxLimitWon).toBe(1_000_000)
    expect(activity.evidenceSubmission).toBe('required')
  })

  it('ACTIVITY에 API layout=meal이 와도 activity로 정규화해 활동비 본문을 연다', () => {
    const activity = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
      itemName: '활동비',
      layout: 'meal',
    })

    expect(activity.layout).toBe('activity')
    expect(activity.maxLimitWon).toBe(1_000_000)
    expect(activity.qualificationLines).toEqual(['참여자에게 지급되는 지원비'])
    expect(activity.remarkLines).toEqual([])
    expect(activity.evidenceSubmission).toBe('required')
  })

  it('GET에 없으면 활동비(ACTIVITY) 카탈로그(1,000,000·필요·비고 blank)를 채운다', () => {
    const detail = mapPaymentItemToSettingDetail({
      id: 12,
      paymentItemType: PaymentItemResponsePaymentItemType.ACTIVITY,
      itemName: '활동비',
      layout: 'activity',
    })

    expect(detail.layout).toBe('activity')
    expect(detail.maxLimitWon).toBe(1_000_000)
    expect(detail.evidenceSubmission).toBe('required')
    expect(detail.qualificationLines).toEqual(['참여자에게 지급되는 지원비'])
    expect(detail.remarkLines).toEqual([])
  })

  it('지급 항목은 top-level 지급요건·비고를 무시하고 detailJson만 읽는다', () => {
    const detail = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      itemName: '식사비',
      layout: 'meal',
      evidenceRequiredYn: true,
      qualificationLines: ['top-level 무시'],
      detailJson: JSON.stringify({
        qualificationLines: ['· detailJson 요건', '내용을 입력해 주세요'],
        remarkLines: ['금액', '실제 비고'],
      }),
    } as Parameters<typeof mapPaymentItemToSettingDetail>[0])

    expect(detail.qualificationLines).toEqual(['detailJson 요건'])
    expect(detail.remarkLines).toEqual(['실제 비고'])
  })

  it('교통비는 minOneWayKm을 우선 읽고 commuteMode는 private_car|public_transit만 허용한다', () => {
    const detail = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      itemName: '강사 교통비',
      layout: 'transport',
      evidenceRequiredYn: false,
      detailJson: JSON.stringify({
        minOneWayKm: 45,
        minDistanceKm: 30,
        transportCommuteMode: 'private_car',
      }),
    })
    expect(detail.basisHours).toBe(45)
    expect(detail.transportCommuteMode).toBe('private_car')

    const ignored = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
      itemName: '학생 교통비',
      layout: 'transport',
      evidenceRequiredYn: true,
      detailJson: JSON.stringify({ transportCommuteMode: 'user_choice' }),
    })
    expect(ignored.transportCommuteMode).toBe('public_transit')
  })

  it('LODGING_1C1S는 detailJson.fixedAmountWon 80000을 정본으로 읽는다', () => {
    const detail = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.LODGING_1C1S,
      itemName: '숙박비 (1사1교)',
      layout: 'lodging',
      maxLimitWon: 99_000,
      maxAmount: 99_000,
      evidenceRequiredYn: false,
      detailJson: JSON.stringify({ fixedAmountWon: 80_000 }),
    })
    expect(detail.maxLimitWon).toBe(80_000)
    expect(detail.evidenceSubmission).toBe('not_required')
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
      '강사비 등 임금 항목에 소득 유형별 원천징수율 적용 (지급 항목은 실비로 제외)',
    ])
    expect(detail.withholdingExclusionMaxWon).toBe(1_000)
    expect(detail.withholdingEarnedIncomeDeductionWon).toBe(150_000)
    expect(detail.withholdingTaxRateBusiness).toBe(3.3)
    expect(detail.withholdingTaxRateOther).toBe(8.8)
    expect(detail.withholdingTaxRatePrize).toBe(4.4)
    expect(detail.withholdingTaxRateInterview).toBe(22)
  })

  it('원천징수 서버 값이 있으면 기본값보다 우선한다 (DEPRECATED 일용·세액공제율은 무시)', () => {
    const detail = mapDeductionItemToSettingDetail({
      id: 166301,
      itemName: '원천징수세액',
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
    expect(detail.withholdingTaxRateDailyWorker).toBeUndefined()
    expect(detail.withholdingTaxRateBusiness).toBe(4.1)
    expect(detail.withholdingTaxRateOther).toBe(9.9)
    expect(detail.withholdingTaxRatePrize).toBe(4.5)
    expect(detail.withholdingTaxRateInterview).toBe(21)
    expect(detail.withholdingEarnedIncomeTaxCreditRate).toBeUndefined()
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

  it('DEPRECATED 일용·세액공제율 키는 매핑하지 않는다', () => {
    const detail = mapDeductionItemToSettingDetail({
      id: 166301,
      itemName: '원천징수세액',
      layout: 'withholdingDailyWorker',
      detailJson: JSON.stringify({
        withholdingTaxRateDailyWorker: null,
        withholdingEarnedIncomeTaxCreditRate: null,
      }),
    })

    expect(detail.withholdingTaxRateDailyWorker).toBeUndefined()
    expect(detail.withholdingEarnedIncomeTaxCreditRate).toBeUndefined()
    expect(detail.withholdingTaxRateBusiness).toBe(3.3)
  })

  it('공제 항목은 top-level 지급요건·비고를 무시하고 detailJson만 읽는다', () => {
    const detail = mapDeductionItemToSettingDetail({
      itemName: '원천징수세액',
      layout: 'withholdingDailyWorker',
      qualificationLines: ['top-level 무시'],
      detailJson: JSON.stringify({
        qualificationLines: ['- detail 요건'],
        remarkLines: ['내용을 입력해 주세요'],
      }),
    } as Parameters<typeof mapDeductionItemToSettingDetail>[0])

    expect(detail.qualificationLines).toEqual(['detail 요건'])
    expect(detail.remarkLines).toEqual([])
  })
})
