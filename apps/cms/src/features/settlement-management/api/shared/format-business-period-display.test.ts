import { describe, expect, it } from 'vitest'
import { formatBusinessPeriodDisplay } from './map-frontend-fields'
import { formatDateDotWithWeekday } from '@/shared/utils/date'

describe('formatBusinessPeriodDisplay', () => {
  it('period(조회월)보다 businessPeriodStart/End를 쓴다', () => {
    expect(
      formatBusinessPeriodDisplay({
        period: '2026-11',
        businessPeriodStart: '2026-01-01',
        businessPeriodEnd: '2026-12-31',
        formatDate: iso => formatDateDotWithWeekday(iso),
      })
    ).toBe('2026.01.01(목) ~ 2026.12.31(목)')
  })

  it('사업 기간이 없으면 - (조회월 period로 채우지 않음)', () => {
    expect(
      formatBusinessPeriodDisplay({
        period: '2026-11',
        formatDate: iso => iso,
      })
    ).toBe('-')
  })
})
