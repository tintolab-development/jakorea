import { describe, expect, it } from 'vitest'
import { mapVolunteerActivityScheduleSlotsToPreferred } from './volunteer-activity-schedule-slots'

describe('mapVolunteerActivityScheduleSlotsToPreferred', () => {
  it('returns an empty array when slots are missing', () => {
    expect(mapVolunteerActivityScheduleSlotsToPreferred(undefined)).toEqual([])
    expect(mapVolunteerActivityScheduleSlotsToPreferred([])).toEqual([])
  })

  it('maps scheduleId, times, and label without inventing ids', () => {
    expect(
      mapVolunteerActivityScheduleSlotsToPreferred([
        {
          scheduleId: 12,
          scheduleName: '1회차',
          label: '3/9 09:00',
          startAt: '2026-03-09T00:00:00Z',
          endAt: '2026-03-09T01:00:00Z',
        },
        {
          scheduleName: '삭제된 일정',
          startAt: '2026-03-10T00:00:00Z',
        },
      ])
    ).toEqual([
      {
        scheduleId: 12,
        startAt: '2026-03-09T00:00:00Z',
        endAt: '2026-03-09T01:00:00Z',
        label: '3/9 09:00',
        scheduleIds: [12],
      },
      {
        scheduleId: null,
        startAt: '2026-03-10T00:00:00Z',
        endAt: null,
        label: '삭제된 일정',
        scheduleIds: [],
      },
    ])
  })
})
