import { describe, expect, it } from 'vitest'
import { explicitClockFromDateValue } from './explicit-clock-from-date-value'

describe('explicitClockFromDateValue', () => {
  it('ignores start-of-day ISO sentinels', () => {
    expect(explicitClockFromDateValue('2026-04-03T00:00:00+09:00')).toBeUndefined()
  })

  it('ignores inclusive end-of-day sentinels', () => {
    expect(explicitClockFromDateValue('2026-04-27T23:59:59+09:00')).toBeUndefined()
    expect(explicitClockFromDateValue('2026-04-27T23:59:00+09:00')).toBeUndefined()
  })

  it('extracts a real clock from ISO', () => {
    expect(explicitClockFromDateValue('2026-04-27T14:00:00+09:00')).toBe('14:00')
  })
})
