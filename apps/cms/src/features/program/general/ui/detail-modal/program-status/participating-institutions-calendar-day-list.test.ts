import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { formatParticipatingSessionsPeriodForCalendarDisplay } from './participating-institutions-calendar-day-list'

function session(overrides: Partial<ParticipatingSchoolSession>): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.04.27',
    dayOfWeek: '월',
    duration: '-',
    format: '-',
    classNum: '',
    timeRange: '09:00 ~ 10:30',
    status: 'pending',
    ...overrides,
  }
}

describe('formatParticipatingSessionsPeriodForCalendarDisplay', () => {
  it('지망 순위(round)를 차시 수로 쓰지 않고 신청 차시 수를 쓴다', () => {
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([
        session({ round: 2, preferenceOrder: 2, requestedSessionCount: 1 }),
      ])
    ).toBe('1차시 (09:00 ~ 10:30)')
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([
        session({ round: 1, preferenceOrder: 1, requestedSessionCount: 2 }),
      ])
    ).toBe('2차시 (09:00 ~ 10:30)')
  })

  it('신청 차시 수가 없으면 N차시 duration·연결 차시 수를 쓴다', () => {
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([session({ round: 7, duration: '2차시' })])
    ).toBe('2차시 (09:00 ~ 10:30)')
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([
        session({ round: 7, duration: '90분', curriculumSessionCount: 2 }),
      ])
    ).toBe('2차시 (09:00 ~ 10:30)')
  })

  it('차시 수를 모르면 일정 건수로 대신하지 않고 시간만 표시한다', () => {
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([session({ round: 3, duration: '90분' })])
    ).toBe('09:00 ~ 10:30')
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([
        session({ round: 1, requestedSessionCount: 2 }),
        session({ round: 2, duration: '40분' }),
      ])
    ).toBe('09:00 ~ 10:30')
    expect(
      formatParticipatingSessionsPeriodForCalendarDisplay([
        session({ round: 1, duration: '90분', timeRange: '-' }),
      ])
    ).toBe('-')
  })
})
