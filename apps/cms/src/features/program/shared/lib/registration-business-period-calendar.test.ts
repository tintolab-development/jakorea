import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  buildRegistrationBusinessPeriodAlertContent,
  composeDisabledDate,
  isOutsideBusinessPeriod,
  isRangeWithinBusinessPeriod,
  readBusinessCalendarPeriod,
  toBusinessPeriodCalendarYmd,
} from './registration-business-period-calendar'

const PERIOD = { start: '2026-10-01', end: '2026-12-31' }

describe('toBusinessPeriodCalendarYmd', () => {
  it('keeps YYYY-MM-DD strings', () => {
    expect(toBusinessPeriodCalendarYmd('2026-10-01')).toBe('2026-10-01')
  })

  it('maps KST midnight ISO to the Seoul calendar day (T27)', () => {
    expect(toBusinessPeriodCalendarYmd('2026-09-30T15:00:00.000Z')).toBe('2026-10-01')
  })
})

describe('isOutsideBusinessPeriod', () => {
  it('T01 disables the day before start', () => {
    expect(isOutsideBusinessPeriod(dayjs('2026-09-30'), PERIOD)).toBe(true)
  })

  it('T02 allows the start day', () => {
    expect(isOutsideBusinessPeriod(dayjs('2026-10-01'), PERIOD)).toBe(false)
  })

  it('T03 allows a mid-range day', () => {
    expect(isOutsideBusinessPeriod(dayjs('2026-11-15'), PERIOD)).toBe(false)
  })

  it('T04 allows the end day', () => {
    expect(isOutsideBusinessPeriod(dayjs('2026-12-31'), PERIOD)).toBe(false)
  })

  it('T05 disables the day after end', () => {
    expect(isOutsideBusinessPeriod(dayjs('2027-01-01'), PERIOD)).toBe(true)
  })

  it('T06 disables every date when the period is unset', () => {
    expect(isOutsideBusinessPeriod(dayjs('2026-11-15'), null)).toBe(true)
  })

  it('T26 supports a period that crosses the year', () => {
    const spanning = { start: '2026-12-20', end: '2027-01-10' }
    expect(isOutsideBusinessPeriod(dayjs('2026-12-31'), spanning)).toBe(false)
    expect(isOutsideBusinessPeriod(dayjs('2027-01-01'), spanning)).toBe(false)
    expect(isOutsideBusinessPeriod(dayjs('2026-12-19'), spanning)).toBe(true)
    expect(isOutsideBusinessPeriod(dayjs('2027-01-11'), spanning)).toBe(true)
  })
})

describe('isRangeWithinBusinessPeriod', () => {
  it('T07 requires both ends inside the period', () => {
    expect(isRangeWithinBusinessPeriod('2026-10-01', '2026-12-31', PERIOD)).toBe(true)
    expect(isRangeWithinBusinessPeriod('2026-09-30', '2026-10-15', PERIOD)).toBe(false)
    expect(isRangeWithinBusinessPeriod('2026-12-01', '2027-01-01', PERIOD)).toBe(false)
  })
})

describe('composeDisabledDate', () => {
  it('T18 / T30 ORs the business period with an existing rule', () => {
    const fridayOnly = (date: dayjs.Dayjs) => date.day() !== 5
    const disabledDate = composeDisabledDate(PERIOD, fridayOnly)
    expect(disabledDate(dayjs('2026-10-01'))).toBe(true)
    expect(disabledDate(dayjs('2026-10-09'))).toBe(false)
    expect(disabledDate(dayjs('2026-09-25'))).toBe(true)
  })
})

describe('readBusinessCalendarPeriod', () => {
  it('reads a seal and swaps inverted bounds', () => {
    expect(
      readBusinessCalendarPeriod({
        start: '2026-12-31T15:00:00.000Z',
        end: '2026-09-30T15:00:00.000Z',
      })
    ).toEqual({ start: '2026-10-01', end: '2027-01-01' })
  })
})

describe('buildRegistrationBusinessPeriodAlertContent', () => {
  it('lists each out-of-range field', () => {
    const content = buildRegistrationBusinessPeriodAlertContent(
      [
        { fieldLabel: '강사 면접일', dateYmd: '2026-09-25' },
        { fieldLabel: '교육 진행 예정일', dateYmd: '2027-01-02' },
      ],
      PERIOD
    )
    expect(content).toContain('강사 면접일(2026.09.25)')
    expect(content).toContain('2026.10.01 ~ 2026.12.31')
    expect(content).toContain('교육 진행 예정일(2027.01.02)')
  })
})
