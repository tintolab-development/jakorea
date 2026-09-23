import { describe, expect, it } from 'vitest'
import { parseCompanySchoolWageAmountFromPricing } from './company-school-wage-pricing'

describe('parseCompanySchoolWageAmountFromPricing', () => {
  it('API wageGradeRows 문구에서 기본·장거리 금액을 읽는다', () => {
    const pricing = '1시간 당 | 기본 : 120,000원 | 장거리 : 60,000원'
    expect(parseCompanySchoolWageAmountFromPricing(pricing, 'regular')).toBe('120,000')
    expect(parseCompanySchoolWageAmountFromPricing(pricing, 'longDistance')).toBe('60,000')
  })

  it('1시간 당 조각을 500,000 폴백 금액으로 쓰지 않는다', () => {
    expect(parseCompanySchoolWageAmountFromPricing('1시간 당', 'regular')).toBeUndefined()
  })

  it('기본 500,000원 한 칸 형식도 읽는다', () => {
    expect(parseCompanySchoolWageAmountFromPricing('기본 500,000원', 'regular')).toBe('500,000')
  })
})
