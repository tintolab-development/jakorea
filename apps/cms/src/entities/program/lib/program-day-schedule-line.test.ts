import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleEventTime } from './program-day-schedule-line'

function program(overrides: Partial<Program> = {}): Program {
  return {
    id: 'program-1',
    sponsorId: 'sponsor-1',
    title: '테스트 프로그램',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-04-03T00:00:00+09:00',
    endDate: '2026-11-20T23:59:59+09:00',
    applicationStartDate: '2026-01-05T00:00:00+09:00',
    applicationEndDate: '2026-01-28T23:59:59+09:00',
    status: 'active',
    createdAt: '2026-01-01T00:00:00+09:00',
    updatedAt: '2026-01-01T00:00:00+09:00',
    ...overrides,
  }
}

describe('getProgramDayScheduleEventTime', () => {
  it('does not invent 15:00 / 00:00 / 24:00 for date-only programs', () => {
    const date = dayjs('2026-04-03T00:00:00+09:00')
    expect(getProgramDayScheduleEventTime(program(), date)).toBe('종일')
  })

  it('uses explicit program clocks when present', () => {
    const date = dayjs('2026-04-03T00:00:00+09:00')
    expect(
      getProgramDayScheduleEventTime(program({ startTime: '09:00', endTime: '12:00' }), date)
    ).toBe('09:00 ~ 12:00')
  })

  it('returns 종일 when scheduleTimeEnabled is false', () => {
    const date = dayjs('2026-04-03T00:00:00+09:00')
    expect(
      getProgramDayScheduleEventTime(
        program({ scheduleTimeEnabled: false, startTime: '09:00', endTime: '12:00' }),
        date
      )
    ).toBe('종일')
  })
})
