import { describe, expect, it } from 'vitest'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  buildIndividualVolunteerAssignmentRowsFromEducationScope,
  canBuildIndividualVolunteerAssignmentRows,
  collectAssignedPreEducationScheduleIds,
  formatVolunteerAssignmentDistanceKm,
  mergeEducationScopeScheduleIdsPreservingPreEducation,
  resolveVolunteerAssignmentDistanceCellLabel,
  VOLUNTEER_ASSIGNMENT_DISTANCE_CALCULATING_LABEL,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment'
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

  it('shows - for null distanceKm and keeps the server km as-is', () => {
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

    const zeroDistance = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      ...base,
      scopeScheduleEnrich: [{ scheduleId: 9003, assignedVolunteerCount: 0, distanceKm: 0 }],
    })
    expect(zeroDistance.waiting[0]?.distanceFromHome).toBe('0km')
  })

  it('puts assigned scheduleIds in assigned only, not waiting', () => {
    const schedules = [
      {
        scheduleId: 9005,
        sessionNo: 1,
        startAt: '2026-10-15T09:00:00+09:00',
        endAt: '2026-10-15T11:00:00+09:00',
      },
      {
        scheduleId: 9006,
        sessionNo: 2,
        startAt: '2026-10-16T09:00:00+09:00',
        endAt: '2026-10-16T11:00:00+09:00',
      },
    ]
    const { assigned, waiting } = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [9005],
      schedules,
    })
    expect(assigned).toHaveLength(1)
    expect(assigned[0]?.scheduleId).toBe(9005)
    expect(waiting).toHaveLength(1)
    expect(waiting[0]?.scheduleId).toBe(9006)
  })

  it('treats a missing schedules enrich list as empty', () => {
    const { waiting } = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [],
      schedules: [
        {
          scheduleId: 9004,
          sessionNo: 1,
          startAt: '2026-10-15T09:00:00+09:00',
          endAt: '2026-10-15T11:00:00+09:00',
        },
      ],
    })
    expect(waiting[0]?.distanceFromHome).toBe('-')
    expect(waiting[0]?.assignedVolunteerCountLabel).toBe('0명')
  })
})

describe('formatVolunteerAssignmentDistanceKm', () => {
  it('returns - for nullish and keeps 0', () => {
    expect(formatVolunteerAssignmentDistanceKm(null)).toBe('-')
    expect(formatVolunteerAssignmentDistanceKm(undefined)).toBe('-')
    expect(formatVolunteerAssignmentDistanceKm(0)).toBe('0km')
  })

  it('does not round the server value', () => {
    expect(formatVolunteerAssignmentDistanceKm(12.3)).toBe('12.3km')
    expect(formatVolunteerAssignmentDistanceKm(287.44)).toBe('287.44km')
    expect(formatVolunteerAssignmentDistanceKm(100)).toBe('100km')
    expect(formatVolunteerAssignmentDistanceKm(250, { longDistance: false })).toBe('250km')
    expect(formatVolunteerAssignmentDistanceKm(250, { longDistance: true })).toBe(
      '250km (장거리)'
    )
  })
})

describe('resolveVolunteerAssignmentDistanceCellLabel', () => {
  it('shows 계산 중 only while fetching an unresolved dash', () => {
    expect(resolveVolunteerAssignmentDistanceCellLabel('-', true)).toBe(
      VOLUNTEER_ASSIGNMENT_DISTANCE_CALCULATING_LABEL
    )
    expect(resolveVolunteerAssignmentDistanceCellLabel('12.3km', true)).toBe('12.3km')
    expect(resolveVolunteerAssignmentDistanceCellLabel('0km', true)).toBe('0km')
    expect(resolveVolunteerAssignmentDistanceCellLabel('-', false)).toBe('-')
  })
})

describe('canBuildIndividualVolunteerAssignmentRows', () => {
  it('requires both schedules and education-scope before splitting rows', () => {
    const schedulesData = {
      schedules: [{ scheduleId: 1, sessionNo: 1, startAt: '', endAt: '' }],
    }
    const scopeData = { scheduleIds: [1], configured: true }

    expect(
      canBuildIndividualVolunteerAssignmentRows({
        remoteEnabled: true,
        schedulesData,
        scopeData: undefined,
      })
    ).toBe(false)

    expect(
      canBuildIndividualVolunteerAssignmentRows({
        remoteEnabled: true,
        schedulesData: undefined,
        scopeData,
      })
    ).toBe(false)

    expect(
      canBuildIndividualVolunteerAssignmentRows({
        remoteEnabled: true,
        schedulesData,
        scopeData,
      })
    ).toBe(true)

    expect(
      canBuildIndividualVolunteerAssignmentRows({
        remoteEnabled: false,
        schedulesData,
        scopeData,
      })
    ).toBe(false)
  })
})

describe('education-scope query key', () => {
  it('prefix matches a participant education-scope key', () => {
    const detail = generalProgramProgressQueryKeys.educationScope('186089', '1694746')
    const prefix = generalProgramProgressQueryKeys.educationScopes()
    expect(detail.slice(0, prefix.length)).toEqual([...prefix])
  })
})

describe('PUT education-scope PRE_ED union (BE merge 대기)', () => {
  const schedules = [
    { scheduleId: 187590, scheduleRole: 'PRE_EDUCATION', educationSlotKey: 'general-pre-education:1' },
    { scheduleId: 9001, scheduleRole: 'EDUCATION' },
    { scheduleId: 9002, scheduleRole: 'EDUCATION' },
  ]

  it('keeps only PRE_ED ids that are already on the current scope', () => {
    expect(
      collectAssignedPreEducationScheduleIds({
        currentScheduleIds: [187590, 9001],
        programSchedules: schedules,
      })
    ).toEqual([187590])
    expect(
      collectAssignedPreEducationScheduleIds({
        currentScheduleIds: [9001],
        programSchedules: schedules,
      })
    ).toEqual([])
  })

  it('unions current PRE_ED onto the next main-education ids', () => {
    expect(
      mergeEducationScopeScheduleIdsPreservingPreEducation({
        nextScheduleIds: [9002],
        preEducationScheduleIds: [187590],
      })
    ).toEqual([9002, 187590])
  })
})
