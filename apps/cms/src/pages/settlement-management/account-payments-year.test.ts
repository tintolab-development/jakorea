import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  AP_YEAR_PARAM,
  parseAccountPaymentsYearParam,
  shiftTransferDateRangeToYear,
} from './account-payments-year'

describe('parseAccountPaymentsYearParam', () => {
  const opts = { minYear: 2023, maxYear: 2026, fallback: 2026 }

  it('유효한 연도면 그대로', () => {
    expect(parseAccountPaymentsYearParam('2025', opts)).toBe(2025)
  })

  it('없거나 잘못되면 fallback을 클램프', () => {
    expect(parseAccountPaymentsYearParam(null, opts)).toBe(2026)
    expect(parseAccountPaymentsYearParam('abc', opts)).toBe(2026)
    expect(parseAccountPaymentsYearParam('2010', opts)).toBe(2026)
  })
})

describe('shiftTransferDateRangeToYear', () => {
  it('월·일을 유지한 채 연도만 바꾼다', () => {
    const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs('2026-10-01'), dayjs('2026-11-01')]
    const shifted = shiftTransferDateRangeToYear(range, 2025)
    expect(shifted?.[0]?.format('YYYY-MM-DD')).toBe('2025-10-01')
    expect(shifted?.[1]?.format('YYYY-MM-DD')).toBe('2025-11-01')
  })

  it('null 구간은 null', () => {
    expect(shiftTransferDateRangeToYear(null, 2025)).toBeNull()
  })
})

describe('AP_YEAR_PARAM', () => {
  it('ap_ prefix', () => {
    expect(AP_YEAR_PARAM).toBe('ap_year')
  })
})
