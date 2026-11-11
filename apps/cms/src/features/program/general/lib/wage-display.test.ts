import { describe, expect, it } from 'vitest'
import {
  applyRegistrationWageOverlayToCommonInfo,
  parseWageGradeAmount,
  parseWageGradeAmountToFormString,
  pricingByWageGrade,
  resolveWagePaymentItemIds,
  resolveWagePaymentItemsView,
} from './wage-display'

describe('parseWageGradeAmount', () => {
  it('파이프 기본 금액과 단순 금액 문자열을 같은 숫자로 읽는다', () => {
    expect(parseWageGradeAmount('1시간 당 | 기본 : 240,000원')).toBe(240_000)
    expect(parseWageGradeAmount('1시간 당 | 100,000원')).toBe(100_000)
    expect(parseWageGradeAmount('1시간 당 | 기본 : -')).toBeNull()
  })

  it('「1시간 당」의 1을 140,000원 금액으로 바꾸지 않는다', () => {
    expect(parseWageGradeAmount('1시간 당 | 기본 : 140,000원')).toBe(140_000)
    expect(parseWageGradeAmount('1시간 당 | 기본 : 120,000원')).toBe(120_000)
    expect(parseWageGradeAmount('1시간 당 | 기본 : 100,000원')).toBe(100_000)
    expect(parseWageGradeAmountToFormString('1시간 당 | 기본 : 140,000원')).toBe('140000')
    expect(parseWageGradeAmountToFormString('1시간 당 | 기본 : 140,000원')).not.toBe('1')
  })
})

describe('pricingByWageGrade', () => {
  it('행 순서가 달라도 급수 라벨로 찾는다', () => {
    const byGrade = pricingByWageGrade([
      { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
      { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
    ])
    expect(parseWageGradeAmount(byGrade['1급 강사비'])).toBe(240_000)
    expect(parseWageGradeAmount(byGrade['2급 강사비'])).toBeNull()
    expect(parseWageGradeAmount(byGrade['3급 강사비'])).toBe(120_000)
  })
})

describe('resolveWagePaymentItemIds', () => {
  it('정산 라벨 교통비를 강사 교통비 옵션 id로 되돌린다', () => {
    expect(resolveWagePaymentItemIds('교통비, 숙박비, 활동비')).toEqual(['p-1', 'p-3', 'p-6'])
    expect(
      resolveWagePaymentItemIds([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'LODGING', useYn: true },
      ])
    ).toEqual(['p-1', 'p-3'])
    expect(resolveWagePaymentItemsView('교통비, 숙박비, 활동비')).toBe(
      '강사 교통비, 숙박비, 활동비'
    )
  })

  it('학생 교통비 GET은 강사 교통과 분리하고, 강사만 있으면 학생을 켜지 않는다', () => {
    expect(
      resolveWagePaymentItemIds([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-1', '학생 교통비'])
    expect(resolveWagePaymentItemIds([{ itemType: 'TRANSPORTATION', useYn: true }])).toEqual(['p-1'])
    expect(resolveWagePaymentItemIds([{ itemType: 'STUDENT_TRANSPORTATION', useYn: true }])).toEqual([
      '학생 교통비',
    ])
  })
})

describe('applyRegistrationWageOverlayToCommonInfo', () => {
  it('중첩 급수 행이 있으면 overlay 금액보다 우선한다', () => {
    const next = applyRegistrationWageOverlayToCommonInfo(
      {
        wageGradeRows: [
          { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
          { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
          { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 90,000원' },
        ],
        paymentItems: '강사 교통비, 숙박비',
      },
      {
        'generalRegistration.wageInfo.grade1Fee': 100_000,
        'generalRegistration.wageInfo.grade2Fee': 80_000,
        'generalRegistration.wageInfo.grade3Fee': 60_000,
        'generalRegistration.wageInfo.paymentItemLabels': '학생 교통비',
      }
    )
    expect(parseWageGradeAmount(next.wageGradeRows?.[0]?.pricing)).toBe(240_000)
    expect(parseWageGradeAmount(next.wageGradeRows?.[1]?.pricing)).toBe(120_000)
    expect(parseWageGradeAmount(next.wageGradeRows?.[2]?.pricing)).toBe(90_000)
    expect(next.paymentItems).toBe('강사 교통비, 숙박비')
  })

  it('중첩 금액이 없으면 overlay 강사비를 조회에 쓴다', () => {
    const next = applyRegistrationWageOverlayToCommonInfo(
      {
        wageGradeRows: [] as Array<{ grade: string; pricing: string }>,
        paymentItems: '',
      },
      {
        'generalRegistration.wageInfo.grade1Fee': 100_000,
        'generalRegistration.wageInfo.paymentItemLabels': '학생 교통비, 강사 교통비',
      }
    )
    expect(parseWageGradeAmount(next.wageGradeRows?.[0]?.pricing)).toBe(100_000)
    expect(next.paymentItems).toBe('학생 교통비, 강사 교통비')
  })
})
