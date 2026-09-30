import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildTimeFrom24Hour } from './date-time-picker-time-selects'

describe('buildTimeFrom24Hour', () => {
  const base = dayjs('2026-10-12')

  it('sets midnight', () => {
    const t = buildTimeFrom24Hour(base, 0, 0)
    expect(t.format('HH:mm')).toBe('00:00')
  })

  it('sets 23:59', () => {
    const t = buildTimeFrom24Hour(base, 23, 59)
    expect(t.format('HH:mm')).toBe('23:59')
  })

  it('clamps out-of-range hour and minute', () => {
    const t = buildTimeFrom24Hour(base, 99, -1)
    expect(t.format('HH:mm')).toBe('23:00')
  })
})
