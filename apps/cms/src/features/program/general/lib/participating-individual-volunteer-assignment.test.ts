import { describe, expect, it } from 'vitest'
import { buildIndividualVolunteerAssignmentRowsFromEducationScope } from '@/features/program/general/lib/participating-individual-volunteer-assignment'
import type { Program } from '@/types/domain'

const program = {
  id: '186089',
  generalProgramAudience: 'individual',
  venue: 'JA코리아 교육장',
} as Program

describe('buildIndividualVolunteerAssignmentRowsFromEducationScope', () => {
  it('prefers participant session over dashboard startAt for schedule label', () => {
    const { waiting } = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [],
      schedules: [
        {
          scheduleId: 9001,
          sessionNo: 1,
          startAt: '2024-10-15T00:00:00+09:00',
          endAt: '2024-10-15T23:59:00+09:00',
        },
      ],
      participantSessions: [
        {
          round: 1,
          date: '2026.10.15',
          dayOfWeek: '목',
          duration: '2시간',
          format: '1회차',
          classNum: '1교시',
          timeRange: '00:00 ~ 23:59',
          status: 'pending',
          resolvedScheduleId: 9001,
        },
      ],
    })

    expect(waiting).toHaveLength(1)
    expect(waiting[0]?.scheduleLabel).toContain('2026')
    expect(waiting[0]?.scheduleLabel).not.toContain('2024')
  })

  it('falls back to program venue when schedule location is missing', () => {
    const { waiting } = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [],
      schedules: [
        {
          scheduleId: 9002,
          sessionNo: 1,
          startAt: '2026-10-15T09:00:00+09:00',
          endAt: '2026-10-15T11:00:00+09:00',
        },
      ],
      serviceRegionFallback: 'JA코리아 교육장',
    })

    expect(waiting[0]?.serviceRegion).toBe('JA코리아 교육장')
    expect(waiting[0]?.assignedVolunteerCountLabel).toBe('0명')
  })

  it('shows - for null distanceKm and formats BE 실측 km', () => {
    const base = {
      program,
      assignedScheduleIds: [] as number[],
      schedules: [
        {
          scheduleId: 9003,
          sessionNo: 1,
          startAt: '2026-10-15T09:00:00+09:00',
          endAt: '2026-10-15T11:00:00+09:00',
          locationName: 'JA 교육장',
        },
      ],
    }

    const withoutDistance = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      ...base,
      scopeScheduleEnrich: [
        { scheduleId: 9003, assignedVolunteerCount: 0, distanceKm: null },
      ],
    })
    expect(withoutDistance.waiting[0]?.distanceFromHome).toBe('-')

    const withDistance = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      ...base,
      scopeScheduleEnrich: [
        { scheduleId: 9003, assignedVolunteerCount: 0, distanceKm: 12.3 },
      ],
    })
    expect(withDistance.waiting[0]?.distanceFromHome).toBe('12.3km')
  })
})
