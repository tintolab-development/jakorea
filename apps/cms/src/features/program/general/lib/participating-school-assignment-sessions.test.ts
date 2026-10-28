import { describe, expect, it } from 'vitest'
import { getParticipatingSchoolAssignmentSessions } from './participating-school-assignment-sessions'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

function session(overrides: Partial<ParticipatingSchoolSession>): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.11.03',
    dayOfWeek: '화',
    duration: '-',
    format: '-',
    classNum: '-',
    timeRange: '-',
    ...overrides,
  }
}

describe('getParticipatingSchoolAssignmentSessions', () => {
  it('uses confirmed participant sessions over preferred schedules', () => {
    const school = {
      preferredEducationSchedules: [
        {
          scheduleId: 10,
          round: 1,
          startAt: '2026-10-26T01:00:00Z',
          endAt: '2026-10-26T03:00:00Z',
          label: null,
        },
      ],
      sessions: [session({ resolvedScheduleId: 187446, scheduleUnresolved: false })],
    } satisfies Pick<ParticipatingSchoolRow, 'preferredEducationSchedules' | 'sessions'>

    const result = getParticipatingSchoolAssignmentSessions(school)
    expect(result).toHaveLength(1)
    expect(result[0]?.resolvedScheduleId).toBe(187446)
  })

  it('does not fall back to preferred schedules when there is no confirmed session', () => {
    const school = {
      preferredEducationSchedules: [
        { scheduleId: 10, round: 1, startAt: '2026-10-26T01:00:00Z', endAt: null, label: null },
      ],
      sessions: undefined,
    } satisfies Pick<ParticipatingSchoolRow, 'preferredEducationSchedules' | 'sessions'>

    expect(getParticipatingSchoolAssignmentSessions(school)).toEqual([])
  })

  it('excludes unresolved, missing schedule id and not_planned sessions', () => {
    const result = getParticipatingSchoolAssignmentSessions({
      sessions: [
        session({ round: 1, resolvedScheduleId: 187446 }),
        session({ round: 2, resolvedScheduleId: null, scheduleUnresolved: true, requestedScheduleId: 5 }),
        session({ round: 3 }),
        session({ round: 4, resolvedScheduleId: 187447, status: 'not_planned' }),
      ],
    })
    expect(result.map(s => s.round)).toEqual([1])
  })
})
