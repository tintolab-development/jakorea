import { describe, expect, it } from 'vitest'
import {
  normalizePreferredEducationScheduleEntry,
  readOrganizationApplicationPreferredEducationSchedules,
} from './organization-application-preferred-education-schedules'

describe('organization-application-preferred-education-schedules', () => {
  it('normalizes string scheduleId for approve slots', () => {
    const entry = normalizePreferredEducationScheduleEntry({
      scheduleId: '188901',
      label: '26년 10월 30일(금) 13:30 ~ 15:30',
      round: 2,
      startAt: '2026-10-30T04:30:00Z',
      endAt: '2026-10-30T06:30:00Z',
    })
    expect(entry?.scheduleId).toBe(188901)
  })

  it('maps resolvedScheduleId when scheduleId is null', () => {
    const entry = normalizePreferredEducationScheduleEntry({
      scheduleId: null,
      resolvedScheduleId: 188900,
      label: '26년 10월 30일(금) 09:30 ~ 11:30',
      round: 1,
    })
    expect(entry?.scheduleId).toBe(188900)
  })

  it('reads preferredEducationSchedules from detail dto', () => {
    const preferred = readOrganizationApplicationPreferredEducationSchedules({
      preferredEducationSchedules: [
        {
          scheduleId: 101,
          label: 'A',
        },
        {
          scheduleId: null,
          resolvedScheduleId: 102,
          label: 'B',
        },
      ],
    })
    expect(preferred).toHaveLength(2)
    expect(preferred[0]?.scheduleId).toBe(101)
    expect(preferred[1]?.scheduleId).toBe(102)
  })
})
