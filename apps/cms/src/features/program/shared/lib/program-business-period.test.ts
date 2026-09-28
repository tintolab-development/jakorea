import { describe, expect, it } from 'vitest'
import { resolveBusinessPeriodDates } from './program-business-period'

describe('resolveBusinessPeriodDates', () => {
  it('businessStartDate/EndDate를 사업 기간으로 쓴다', () => {
    expect(
      resolveBusinessPeriodDates({
        startDate: '2026-10-21',
        endDate: '2026-11-01',
        businessStartDate: '2026-10-14',
        businessEndDate: '2026-11-07',
      })
    ).toEqual({ startDate: '2026-10-14', endDate: '2026-11-07' })
  })

  it('연도를 넘는 business 기간도 그대로 쓴다', () => {
    expect(
      resolveBusinessPeriodDates({
        businessStartDate: '2025-04-01',
        businessEndDate: '2027-08-23',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })
    ).toEqual({ startDate: '2025-04-01', endDate: '2027-08-23' })
  })

  it('business 기간이 없으면 startDate/endDate로 폴백한다', () => {
    expect(
      resolveBusinessPeriodDates({
        startDate: '2026-10-21',
        endDate: '2026-11-01',
      })
    ).toEqual({ startDate: '2026-10-21', endDate: '2026-11-01' })
  })
})
