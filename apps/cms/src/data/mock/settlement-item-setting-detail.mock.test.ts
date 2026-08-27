import { describe, expect, it } from 'vitest'
import { getSettlementItemSettingDetail } from './settlement-item-setting-detail.mock'

describe('임금 항목 상세 mock (시안 6장)', () => {
  it('1~3급은 가로 조건·산정 표(tier1)와 시안 한도·지급 요건을 갖는다', () => {
    const w1 = getSettlementItemSettingDetail('w-1')
    const w2 = getSettlementItemSettingDetail('w-2')
    const w3 = getSettlementItemSettingDetail('w-3')

    expect(w1.layout).toBe('tier1')
    expect(w1.maxLimitWon).toBe(500_000)
    expect(w1.basisHours).toBe(1)
    expect(w1.qualificationLines.at(-1)).toContain('교육운영본부 사무총장')

    expect(w2.layout).toBe('tier1')
    expect(w2.maxLimitWon).toBe(400_000)

    expect(w3.layout).toBe('tier1')
    expect(w3.maxLimitWon).toBe(300_000)
  })

  it('특강은 조건 표만(specialLecture), 기타 인건비는 빈 지급 요건·비고', () => {
    const special = getSettlementItemSettingDetail('w-4')
    const otherLabor = getSettlementItemSettingDetail('w-5')

    expect(special.layout).toBe('specialLecture')
    expect(special.qualificationLines).toEqual([
      '국내외 해당 분야 최고 권위자로 총장이 인정하는 자',
    ])

    expect(otherLabor.layout).toBe('specialLecture')
    expect(otherLabor.qualificationLines).toEqual([])
    expect(otherLabor.remarkLines).toEqual([])
  })

  it('제미나이는 gemini layout과 1~4차시 고정액이다', () => {
    const gemini = getSettlementItemSettingDetail('w-gemini')

    expect(gemini.layout).toBe('gemini')
    expect(gemini.qualificationLines).toEqual(['제미나이 프로그램에서 사용되는 강사 임금'])
    expect(gemini.remarkLines).toHaveLength(2)
    expect(gemini.geminiSession1Won).toBe(0)
    expect(gemini.geminiSession2Won).toBe(170_000)
    expect(gemini.geminiSession3Won).toBe(220_000)
    expect(gemini.geminiSession4Won).toBe(270_000)
  })
})

describe('지급·공제 항목 상세 mock (시안 6장)', () => {
  it('교통비 p-1·p-2는 transport layout과 이용 수단·증빙 기본값을 갖는다', () => {
    const instructor = getSettlementItemSettingDetail('p-1')
    const student = getSettlementItemSettingDetail('p-2')

    expect(instructor.layout).toBe('transport')
    expect(instructor.transportCommuteMode).toBe('private_car')
    expect(instructor.evidenceSubmission).toBe('not_required')
    expect(instructor.qualificationLines[0]).toContain('네이버 지도')

    expect(student.layout).toBe('transport')
    expect(student.transportCommuteMode).toBe('public_transit')
    expect(student.evidenceSubmission).toBe('required')
    expect(student.qualificationLines[0]).toContain('대중교통')
  })

  it('식사비 p-4는 최대 한도 30,000과 1인 1식 기준이다', () => {
    const meal = getSettlementItemSettingDetail('p-4')

    expect(meal.layout).toBe('meal')
    expect(meal.maxLimitWon).toBe(30_000)
    expect(meal.qualificationLines).toEqual(['1인 1식 기준'])
  })

  it('활동비 p-6는 layout=meal, 최대 한도 50,000과 참여자 지원비 문구이다', () => {
    const activity = getSettlementItemSettingDetail('p-6')

    expect(activity.layout).toBe('meal')
    expect(activity.maxLimitWon).toBe(50_000)
    expect(activity.qualificationLines).toEqual(['참여자에게 지급되는 지원비'])
  })

  it('숙박비(1사1교) p-7은 lodging layout과 80,000 지급액이다', () => {
    const lodging = getSettlementItemSettingDetail('p-7')

    expect(lodging.layout).toBe('lodging')
    expect(lodging.maxLimitWon).toBe(80_000)
    expect(lodging.evidenceSubmission).toBe('not_required')
  })

  it('일용근로자 원천징수 d-1은 Notion 공제 수치를 갖는다', () => {
    const withholding = getSettlementItemSettingDetail('d-1')

    expect(withholding.layout).toBe('withholdingDailyWorker')
    expect(withholding.qualificationLines).toEqual(['지급액이 125,000원 초과인 경우'])
    expect(withholding.withholdingExclusionMaxWon).toBe(1_000)
    expect(withholding.withholdingEarnedIncomeDeductionWon).toBe(150_000)
    expect(withholding.withholdingTaxRateBusiness).toBe(3.3)
    expect(withholding.withholdingTaxRateOther).toBe(8.8)
    expect(withholding.withholdingTaxRatePrize).toBe(4.4)
    expect(withholding.withholdingTaxRateInterview).toBe(22)
  })
})
