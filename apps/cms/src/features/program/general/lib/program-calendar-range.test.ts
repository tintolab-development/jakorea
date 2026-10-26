import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  mapProgramListViewToCalendarProgramStatus,
  resolveProgramCalendarVisibleRange,
} from './program-calendar-range'

describe('resolveProgramCalendarVisibleRange', () => {
  it('uses the full month grid including leading and trailing days', () => {
    const range = resolveProgramCalendarVisibleRange('month', dayjs('2026-10-15'))
    expect(range.startDate).toBe('2026-09-27')
    expect(range.endDate).toBe('2026-10-31')
  })

  it('uses the visible week for week mode', () => {
    const range = resolveProgramCalendarVisibleRange('week', dayjs('2026-10-21'))
    expect(range.startDate).toBe('2026-10-18')
    expect(range.endDate).toBe('2026-10-24')
  })
})

describe('mapProgramListViewToCalendarProgramStatus', () => {
  it('maps list tabs to BE programStatus', () => {
    expect(mapProgramListViewToCalendarProgramStatus('ALL')).toBe('ALL')
    expect(mapProgramListViewToCalendarProgramStatus('SCHEDULED')).toBe('UPCOMING')
    expect(mapProgramListViewToCalendarProgramStatus('IN_PROGRESS')).toBe('IN_PROGRESS')
    expect(mapProgramListViewToCalendarProgramStatus('COMPLETED')).toBe('COMPLETED')
  })
})
