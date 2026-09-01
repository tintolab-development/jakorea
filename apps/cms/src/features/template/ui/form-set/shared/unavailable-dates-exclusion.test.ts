import { describe, expect, it } from 'vitest'
import {
  buildRecurringUnavailableLabel,
  resolveUnavailableDatesExclusionState,
} from './unavailable-dates-exclusion'

describe('resolveUnavailableDatesExclusionState', () => {
  it('recurring 제외가 있으면 excludeNone은 false', () => {
    expect(
      resolveUnavailableDatesExclusionState({
        recurringUnavailable: '일요일, 공휴일',
      })
    ).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: true,
      excludeHoliday: true,
    })
  })

  it('직접 추가 불가일만 있으면 excludeNone은 false', () => {
    expect(
      resolveUnavailableDatesExclusionState({
        recurringUnavailable: '',
        hasSpecificUnavailableDates: true,
      })
    ).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    })
  })

  it('반복·직접 불가일이 없으면 excludeNone은 true', () => {
    expect(
      resolveUnavailableDatesExclusionState({
        recurringUnavailable: '',
        hasSpecificUnavailableDates: false,
      })
    ).toEqual({
      excludeNone: true,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    })
  })
})

describe('buildRecurringUnavailableLabel', () => {
  it('excludeNone이면 빈 문자열', () => {
    expect(
      buildRecurringUnavailableLabel({
        excludeNone: true,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: false,
      })
    ).toBe('')
  })

  it('선택된 요일·공휴일을 라벨로 조합', () => {
    expect(
      buildRecurringUnavailableLabel({
        excludeNone: false,
        excludeSaturday: true,
        excludeSunday: true,
        excludeHoliday: true,
      })
    ).toBe('토요일, 일요일, 공휴일')
  })
})
