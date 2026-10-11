import { describe, expect, it } from 'vitest'
import { mapInstructorPreferredOrganizationsToPreferredSchools } from './map-instructor-preferred-organizations'

describe('mapInstructorPreferredOrganizationsToPreferredSchools', () => {
  it('maps dateRangeLabel and organizationName to preferredSchools', () => {
    const rows = mapInstructorPreferredOrganizationsToPreferredSchools([
      {
        preferenceOrder: 1,
        organizationName: 'OO초등학교',
        educationGrade: '3학년',
        dateRangeLabel: '2026.04.01(화) ~ 2026.04.03(목)',
        scheduleId: 99,
      },
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.schoolName).toBe('OO초등학교')
    expect(rows[0]?.grade).toBe('3학년')
    expect(rows[0]?.dateRange).toContain('2026.04.01')
    expect(rows[0]?.schoolId).toBe('99')
  })

  it('formats startAt/endAt when dateRangeLabel is missing', () => {
    const rows = mapInstructorPreferredOrganizationsToPreferredSchools([
      {
        organizationName: 'AA중학교',
        startAt: '2026-05-10T09:00:00+09:00',
        endAt: '2026-05-12T11:00:00+09:00',
      },
    ])

    expect(rows[0]?.dateRange).toMatch(/2026\.05\.10.*~.*2026\.05\.12/)
  })

  it('keeps empty schoolName when organizationName is null (no programName fallback)', () => {
    const rows = mapInstructorPreferredOrganizationsToPreferredSchools([
      {
        dateRangeLabel: '2026.10.01(목) 09:00 - 11:00',
        scheduleId: 1,
      },
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.schoolName).toBe('')
    expect(rows[0]?.dateRange).toContain('2026.10.01')
  })
})
