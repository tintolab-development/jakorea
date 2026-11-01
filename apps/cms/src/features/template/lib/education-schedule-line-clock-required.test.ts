import { describe, expect, it } from 'vitest'
import {
  isEducationScheduleProgressLineMissing,
  isEducationScheduleProgressLineMissingOrWithoutClock,
  isEducationScheduleProgressLinePersistBlocked,
  isEducationScheduleProgressLineWithRequiredClock,
} from '@/features/template/lib/education-schedule-line-clock-required'

describe('isEducationScheduleProgressLineWithRequiredClock', () => {
  it('returns false for empty', () => {
    expect(isEducationScheduleProgressLineWithRequiredClock('')).toBe(false)
    expect(isEducationScheduleProgressLineWithRequiredClock(null)).toBe(false)
  })

  it('returns false for date-only line', () => {
    expect(isEducationScheduleProgressLineWithRequiredClock('26년 9월 18일(금)')).toBe(false)
  })

  it('returns true when clock is present', () => {
    expect(
      isEducationScheduleProgressLineWithRequiredClock('26년 4월 20일(월) 9:30 ~ 12:20')
    ).toBe(true)
  })
})

describe('isEducationScheduleProgressLineMissing', () => {
  it('accepts date-only line', () => {
    expect(isEducationScheduleProgressLineMissing('26년 9월 18일(금)')).toBe(false)
  })

  it('treats empty as missing', () => {
    expect(isEducationScheduleProgressLineMissing('')).toBe(true)
  })
})

describe('isEducationScheduleProgressLineMissingOrWithoutClock', () => {
  it('treats empty and date-only as incomplete', () => {
    expect(isEducationScheduleProgressLineMissingOrWithoutClock('')).toBe(true)
    expect(isEducationScheduleProgressLineMissingOrWithoutClock('26년 9월 18일(금)')).toBe(
      true
    )
  })

  it('accepts line with clock', () => {
    expect(
      isEducationScheduleProgressLineMissingOrWithoutClock('26년 4월 20일(월) 10:00 ~ 12:00')
    ).toBe(false)
  })
})

describe('isEducationScheduleProgressLinePersistBlocked', () => {
  it('깨진 월일은 막고 여러 날+시각은 허용한다', () => {
    expect(
      isEducationScheduleProgressLinePersistBlocked('2026.13.40(목) 10:00 ~ 11:00')
    ).toBe(true)
    expect(
      isEducationScheduleProgressLinePersistBlocked(
        '2026.11.05(목) 11:00 ~ 2026.11.06(금) 18:00'
      )
    ).toBe(false)
    expect(
      isEducationScheduleProgressLinePersistBlocked('2026.11.05(목) 10:00 ~ 11:00')
    ).toBe(false)
    expect(isEducationScheduleProgressLinePersistBlocked('')).toBe(false)
  })
})
