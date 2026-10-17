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

  it('does not turn a derived schedule ID into an approval schedule ID', () => {
    const entry = normalizePreferredEducationScheduleEntry({
      scheduleId: null,
      resolvedScheduleId: 188900,
      label: '26년 10월 30일(금) 09:30 ~ 11:30',
      round: 1,
    })
    expect(entry?.scheduleId).toBeNull()
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
          unresolvedReason: 'AMBIGUOUS_SCHEDULE_MATCH',
          label: 'B',
        },
      ],
    })
    expect(preferred).toHaveLength(2)
    expect(preferred[0]?.scheduleId).toBe(101)
    expect(preferred[1]?.scheduleId).toBeNull()
    expect(preferred[1]?.unresolvedReason).toBe('AMBIGUOUS_SCHEDULE_MATCH')
  })
})
