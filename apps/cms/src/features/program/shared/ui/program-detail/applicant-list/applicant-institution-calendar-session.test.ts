import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  resolveSessionCalendarClockTimes,
  resolveSessionCalendarIsoRange,
} from './applicant-institution-calendar-session'

function session(
  overrides: Partial<ParticipatingSchoolSession>
): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.10.27',
    dayOfWeek: '화',
    duration: '-',
    format: '-',
    classNum: '1차시',
    timeRange: '-',
    status: 'pending',
    ...overrides,
  }
}

describe('resolveSessionCalendarClockTimes', () => {
  it('reads HH:mm from timeRange', () => {
    expect(
      resolveSessionCalendarClockTimes(session({ timeRange: '03:55 ~ 04:50' }))
    ).toEqual({ startTime: '03:55', endTime: '04:50' })
  })

  it('reads HH:mm embedded in scheduleLabel when timeRange is empty', () => {
    expect(
      resolveSessionCalendarClockTimes(
        session({
          timeRange: '-',
          scheduleLabel: '3차시 (03:55 ~ 04:50)',
        })
      )
    ).toEqual({ startTime: '03:55', endTime: '04:50' })
  })

  it('does not treat date-only dotted date as midnight class time', () => {
    expect(
      resolveSessionCalendarClockTimes(
        session({
          date: '2026.10.27',
          timeRange: '-',
        })
      )
    ).toBeNull()
  })
})

describe('resolveSessionCalendarIsoRange', () => {
  it('keeps date-only sessions as all-day ISO', () => {
    expect(resolveSessionCalendarIsoRange(session({ timeRange: '-' }))).toEqual({
      dateKey: '2026-10-27',
      startDate: '2026-10-27T00:00:00',
      endDate: '2026-10-27T23:59:59',
    })
  })

  it('uses scheduleLabel clocks even when date is a dotted date-only value', () => {
    expect(
      resolveSessionCalendarIsoRange(
        session({
          timeRange: '-',
          scheduleLabel: '3차시 (03:55 ~ 04:50)',
        })
      )
    ).toEqual({
      dateKey: '2026-10-27',
      startDate: '2026-10-27T03:55:00',
      endDate: '2026-10-27T04:50:00',
    })
  })
})
