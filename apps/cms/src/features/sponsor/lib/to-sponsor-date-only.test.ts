import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { toSponsorDateOnly } from './to-sponsor-date-only'

describe('toSponsorDateOnly', () => {
  it('keeps the selected calendar date as YYYY-MM-DD', () => {
    expect(toSponsorDateOnly(dayjs('2026-10-14'))).toBe('2026-10-14')
  })

  it('returns undefined when the picker is cleared', () => {
    expect(toSponsorDateOnly(null)).toBeUndefined()
  })
})
