import { describe, expect, it } from 'vitest'
import { getParticipatingSchoolAssignmentSessions } from './participating-school-assignment-sessions'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'

describe('getParticipatingSchoolAssignmentSessions', () => {
  it('prefers B over participant sessions', () => {
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
      sessions: [
        {
          round: 9,
          date: '2026.01.01',
          dayOfWeek: '목',
          duration: '-',
          format: '-',
          classNum: '-',
          timeRange: '-',
        },
      ],
    } satisfies Pick<ParticipatingSchoolRow, 'preferredEducationSchedules' | 'sessions'>

    const result = getParticipatingSchoolAssignmentSessions(school)
    expect(result).toHaveLength(1)
    expect(result[0]?.resolvedScheduleId).toBe(10)
  })
})
