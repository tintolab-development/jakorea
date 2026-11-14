import { describe, expect, it } from 'vitest'
import {
  resolveUjatHalfEducationScheduleDisplayFromTypedDetail,
  resolveUjatHalfScheduleGroupedTextFromTypedDetail,
} from './ujat-half-education-schedule-display'
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
                excludeHoliday: true,
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

describe('UJAT 상세 조회 — 사전교육·해단식 일정 날짜별 묶음', () => {
  const preRow = (order: number, regionCode: string | null, date: string | null) => ({
    rowId: `pre-${order}`,
    displayOrder: order,
    educationName: '사전교육(발대식)',
    educationMethod: 'online',
    regionCode,
    startDate: date,
    endDate: date,
    dates: date ? [date] : [],
    scheduleIds: [],
  })
  const withPreRows = (rows: ReturnType<typeof preRow>[]) => ({
    schemaVersion: 1,
    common: null,
    halfPlans: [
      {
        semesterType: 'FIRST_HALF' as const,
        stages: [{ stage: 'PRE_EDUCATION' as const, rows }],
      },
    ],
  })

  it('같은 날짜의 지역을 입력 순서대로 한 줄로 묶는다', () => {
    const text = resolveUjatHalfScheduleGroupedTextFromTypedDetail(
      withPreRows([
        preRow(3, 'DAEGU', '2026-02-27'),
        preRow(1, 'SEOUL', '2026-02-25'),
        preRow(2, 'INCHEON', '2026-02-25'),
      ]),
      'h1',
      'pre'
    )
    const lines = text.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^.+, .+ : 2026\.02\.25/)
    expect(lines[1]).toMatch(/^.+ : 2026\.02\.27/)
  })

  it('지역·날짜가 모두 없는 행은 빼고, 일정이 없으면 - 를 돌려준다', () => {
    expect(
      resolveUjatHalfScheduleGroupedTextFromTypedDetail(withPreRows([preRow(1, null, null)]), 'h1', 'pre')
    ).toBe('-')
    expect(resolveUjatHalfScheduleGroupedTextFromTypedDetail(withPreRows([]), 'h1', 'closing')).toBe('-')
  })
})
