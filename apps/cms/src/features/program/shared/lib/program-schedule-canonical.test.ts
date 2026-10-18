import { describe, expect, it } from 'vitest'
import {
  filterProgramSchedulesForNewEducationAssignment,
  isLegacyProgramScheduleWithoutEducationSlotKey,
  isProgramScheduleCandidateForNewEducationAssignment,
  readProgramScheduleCanonicalFields,
  resolveProgramScheduleListRowKey,
} from './program-schedule-canonical'

describe('program-schedule-canonical', () => {
  it('reads null canonical fields for legacy schedules', () => {
    expect(readProgramScheduleCanonicalFields({ id: 186892, sessionNo: 1 })).toEqual({
      educationSlotKey: null,
      scheduleRole: null,
      scheduleStatus: null,
      publiclyVisible: null,
    })
    expect(isLegacyProgramScheduleWithoutEducationSlotKey({ id: 1 })).toBe(true)
  })

  it('reads additive fields when present', () => {
    expect(
      readProgramScheduleCanonicalFields({
        id: 186691,
        educationSlotKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        publiclyVisible: true,
      })
    ).toEqual({
      educationSlotKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      scheduleRole: 'EDUCATION',
      scheduleStatus: 'ACTIVE',
      publiclyVisible: true,
    })
    expect(
      isLegacyProgramScheduleWithoutEducationSlotKey({
        educationSlotKey: 'uuid',
        scheduleRole: null,
      })
    ).toBe(false)
  })

  it('filters PRE_EDUCATION and non-ACTIVE for new assignment candidates', () => {
    const rows = [
      { id: 1, scheduleRole: 'EDUCATION', scheduleStatus: 'ACTIVE' },
      { id: 2, scheduleRole: 'PRE_EDUCATION', scheduleStatus: 'ACTIVE' },
      { id: 3, scheduleRole: 'SESSION', scheduleStatus: 'CANCELLED' },
      { id: 4, scheduleRole: null, scheduleStatus: null },
    ]
    expect(filterProgramSchedulesForNewEducationAssignment(rows).map(r => r.id)).toEqual([1, 4])
    expect(isProgramScheduleCandidateForNewEducationAssignment({ id: 2, scheduleRole: 'CLOSING' })).toBe(
      false
    )
  })

  it('filters multi-day all-day period windows from new assignment candidates', () => {
    const rows = [
      {
        id: 10,
        sessionNo: null,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        allDay: true,
        startAt: '2026-11-04T15:00:00Z',
        endAt: '2026-11-13T15:00:00Z',
      },
      {
        id: 11,
        sessionNo: 1,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        allDay: true,
        startAt: '2026-11-04T15:00:00Z',
        endAt: '2026-11-05T15:00:00Z',
      },
    ]
    expect(filterProgramSchedulesForNewEducationAssignment(rows).map(r => r.id)).toEqual([11])
    expect(isProgramScheduleCandidateForNewEducationAssignment(rows[0])).toBe(false)
  })

  it('uses educationSlotKey as list row key with id fallback', () => {
    expect(
      resolveProgramScheduleListRowKey({
        id: 186691,
        educationSlotKey: 'slot-uuid',
      })
    ).toBe('slot-uuid')
    expect(
      resolveProgramScheduleListRowKey({
        id: 186691,
        educationSlotKey: null,
      })
    ).toBe('186691')
    expect(
      resolveProgramScheduleListRowKey({
        id: undefined,
        educationSlotKey: null,
      })
    ).toBeNull()
  })
})
