import { describe, expect, it } from 'vitest'
import {
  applyRegistrationWageOverlayToCommonInfo,
  parseWageGradeAmount,
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
    expect(resolveWagePaymentItemsView('교통비, 숙박비, 활동비')).toBe(
      '강사 교통비, 숙박비, 활동비'
    )
  })
})

describe('applyRegistrationWageOverlayToCommonInfo', () => {
  it('조회용 1원 행보다 등록 overlay 금액을 우선한다', () => {
    const next = applyRegistrationWageOverlayToCommonInfo(
      {
        wageGradeRows: [
          { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 1원' },
          { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 1원' },
          { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 1원' },
        ],
        paymentItems: '학생 교통비, 강사 교통비',
      },
      {
        'generalRegistration.wageInfo.grade1Fee': 100_000,
        'generalRegistration.wageInfo.grade2Fee': 80_000,
        'generalRegistration.wageInfo.grade3Fee': 60_000,
        'generalRegistration.wageInfo.paymentItemLabels': '학생 교통비, 강사 교통비',
      }
    )
    expect(parseWageGradeAmount(next.wageGradeRows?.[0]?.pricing)).toBe(100_000)
    expect(parseWageGradeAmount(next.wageGradeRows?.[1]?.pricing)).toBe(80_000)
    expect(parseWageGradeAmount(next.wageGradeRows?.[2]?.pricing)).toBe(60_000)
    expect(next.paymentItems).toBe('학생 교통비, 강사 교통비')
  })
})
