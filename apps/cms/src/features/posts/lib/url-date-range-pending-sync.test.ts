import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  resolvePendingDateRangeFromUrl,
  type UrlDateRangePendingSyncRef,
} from './url-date-range-pending-sync'

describe('resolvePendingDateRangeFromUrl', () => {
  it('restores a start-only range from URL', () => {
    const ref: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
    const range = resolvePendingDateRangeFromUrl({
      ref,
      from: '2026-01-01',
      to: null,
      prev: null,
    })
    expect(range?.[0]?.format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(range?.[1]).toBeNull()
  })

  it('restores an end-only range from URL', () => {
    const ref: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
    const range = resolvePendingDateRangeFromUrl({
      ref,
      from: null,
      to: '2026-01-31',
      prev: [dayjs('2026-01-01'), null],
    })
    expect(range?.[0]).toBeNull()
    expect(range?.[1]?.format('YYYY-MM-DD')).toBe('2026-01-31')
  })

  it('keeps in-progress picker values when URL has no dates yet', () => {
    const ref: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }
    const prev: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [dayjs('2026-01-01'), null]
    const range = resolvePendingDateRangeFromUrl({
      ref,
      from: null,
      to: null,
      prev,
    })
    expect(range).toBe(prev)
  })
})
