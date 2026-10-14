import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  applySplitDateRangeEndChange,
  applySplitDateRangeStartChange,
} from './split-date-range-on-change'

describe('applySplitDateRangeStartChange', () => {
  it('pulls end to start when start moves after end (day)', () => {
    const start = dayjs('2026-03-15')
    const end = dayjs('2026-03-10')
    const [nextStart, nextEnd] = applySplitDateRangeStartChange(end, start)
    expect(nextStart?.format('YYYY-MM-DD')).toBe('2026-03-15')
    expect(nextEnd?.format('YYYY-MM-DD')).toBe('2026-03-15')
  })

  it('keeps end when start is before end', () => {
    const start = dayjs('2026-03-01')
    const end = dayjs('2026-03-31')
    const [nextStart, nextEnd] = applySplitDateRangeStartChange(end, start)
    expect(nextStart?.format('YYYY-MM-DD')).toBe('2026-03-01')
    expect(nextEnd?.format('YYYY-MM-DD')).toBe('2026-03-31')
  })
})

describe('applySplitDateRangeEndChange', () => {
  it('swaps when end is before start (day)', () => {
    const start = dayjs('2026-03-20')
    const end = dayjs('2026-03-05')
    const [nextStart, nextEnd] = applySplitDateRangeEndChange(start, end)
    expect(nextStart?.format('YYYY-MM-DD')).toBe('2026-03-05')
    expect(nextEnd?.format('YYYY-MM-DD')).toBe('2026-03-20')
  })
})
