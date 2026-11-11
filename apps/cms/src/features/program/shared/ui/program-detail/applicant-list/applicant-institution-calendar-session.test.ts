import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatInstitutionCalendarSessionTimeDisplay,
  formatInstitutionCalendarSessionsTimeDisplay,
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

describe('formatInstitutionCalendarSessionsTimeDisplay — 회차·차시 혼동 금지', () => {
  it('같은 날 일정 건수를 차시로 쓰지 않는다(차시 수가 없으면 시간만)', () => {
    expect(
      formatInstitutionCalendarSessionsTimeDisplay([
        session({ round: 1, classNum: '', timeRange: '09:00 ~ 10:00' }),
        session({ round: 2, classNum: '', timeRange: '11:00 ~ 12:00' }),
      ])
    ).toBe('09:00 ~ 12:00')
  })

  it('신청 행의 차시 수는 합산해 N차시로 쓴다', () => {
    expect(
      formatInstitutionCalendarSessionsTimeDisplay([
        session({ round: 1, classNum: '2차시', timeRange: '09:00 ~ 10:00' }),
        session({ round: 2, classNum: '1차시', timeRange: '11:00 ~ 12:00' }),
      ])
    ).toBe('3차시 (09:00 ~ 12:00)')
  })

  it('round(지망 순위·순번)를 회차로 쓰지 않는다', () => {
    expect(
      formatInstitutionCalendarSessionTimeDisplay(
        session({ round: 2, classNum: '', timeRange: '09:20 ~ 11:20' })
      )
    ).toBe('09:20 ~ 11:20')
  })

  it('1사1교·Gemini 교시 행은 기존 표기를 유지한다', () => {
    expect(
      formatInstitutionCalendarSessionTimeDisplay(
        session({ round: 1, classNum: '3교시', duration: '1차시', timeRange: '3교시' })
      )
    ).toBe('1회차')
    expect(
      formatInstitutionCalendarSessionsTimeDisplay([
        session({ round: 1, classNum: '1교시', timeRange: '09:00 ~ 09:40' }),
        session({ round: 2, classNum: '2교시', timeRange: '09:50 ~ 10:30' }),
      ])
    ).toBe('2차시 (09:00 ~ 10:30)')
  })
})
