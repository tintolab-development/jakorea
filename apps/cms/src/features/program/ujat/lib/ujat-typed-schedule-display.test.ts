import { describe, expect, it } from 'vitest'
import { resolveUjatHalfEducationScheduleDisplayFromTypedDetail } from './ujat-half-education-schedule-display'
import { resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail } from './ujat-education-schedule-settings-display'

const detail = {
  schemaVersion: 1,
  revision: 4,
  common: null,
  halfPlans: [
    {
      semesterType: 'FIRST_HALF' as const,
      stages: [
        {
          stage: 'MAIN_EDUCATION' as const,
          rows: [
            {
              rowId: 'h1-main-1',
              displayOrder: 1,
              educationName: '상반기 본교육',
              educationMethod: 'offline',
              startDate: '2027-04-01',
              endDate: '2027-04-30',
              dates: ['2027-04-01'],
              scheduleIds: [187001],
              excludedDates: ['2027-04-10'],
              exclusion: {
                excludeNone: false,
                excludeSaturday: true,
                excludeSunday: false,
                excludePublicHoliday: true,
              },
            },
          ],
        },
      ],
    },
  ],
}

describe('UJAT typed H1/H2 schedule display', () => {
  it('reads the typed row name, range and physical schedule independently of overlay', () => {
    const display = resolveUjatHalfEducationScheduleDisplayFromTypedDetail(detail, 'h1')

    expect(display.eventSchedule).toMatchObject({
      scheduleName: '상반기 본교육',
      deliveryLabel: '오프라인',
    })
    expect(display.eventSchedule.scheduleText).toContain('2027.04.01')
    expect(display.eventSchedule.scheduleText).toContain('2027.04.30')
  })

  it('maps typed exclusion policy and unavailable dates to settings display', () => {
    const display = resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail('h1', detail)

    expect(display.eventRange).toEqual({ start: '2027-04-01', end: '2027-04-30' })
    expect(display.unavailableDates).toEqual(['2027-04-10'])
    expect(display.exclusion).toEqual({
      excludeNone: false,
      excludeSaturday: true,
      excludeSunday: false,
      excludeHoliday: true,
    })
  })
})
