import { describe, expect, it } from 'vitest'
import {
  buildUjatProgramScheduleDates,
  buildUjatScheduleAssignDates,
  collectPreferredEducationIsoDates,
  formatScheduleColumnTitle,
  formatUjatPreferredEducationDateDisplay,
  scheduleColumnsFromIsoDates,
} from './education-schedule'

describe('formatScheduleColumnTitle', () => {
  it('GET 일정 달력일을 M월 D일로 표시한다', () => {
    expect(formatScheduleColumnTitle('2026-04-03')).toBe('4월 3일')
    expect(formatScheduleColumnTitle('2026-04-17')).toBe('4월 17일')
  })
})

describe('buildUjatProgramScheduleDates', () => {
  it('schedules startAt만 쓰고 overlay·일정명으로 헤더를 채우지 않는다', () => {
    const dates = buildUjatProgramScheduleDates([
      {
        id: 1,
        name: 'UJAT 교육 1회차',
        startAt: '2026-04-17T00:00:00+09:00',
        semesterType: 'FIRST_HALF',
      },
    ])

    expect(dates).toEqual([
      {
        isoDate: '2026-04-17',
        title: '4월 17일',
        semester: 'h1',
        scheduleId: 1,
      },
    ])
  })

  it('overlay 없이 API 학기가 없으면 semester를 null로 둔다', () => {
    const dates = buildUjatProgramScheduleDates([
      { id: 2, startAt: '2026-10-16T00:00:00+09:00' },
    ])

    expect(dates[0]?.semester).toBeNull()
    expect(dates[0]?.title).toBe('10월 16일')
  })

  it('Typed Detail의 반기 range로 API 일정의 학기를 판정한다', () => {
    const dates = buildUjatProgramScheduleDates(
      [{ id: 202, startAt: '2027-10-16T00:00:00+09:00' }],
      {
        schemaVersion: 1,
        halfPlans: [
          {
            semesterType: 'SECOND_HALF',
            stages: [
              {
                stage: 'MAIN_EDUCATION',
                rows: [{ startDate: '2027-10-01', endDate: '2027-10-31' }],
              },
            ],
          },
        ],
      }
    )

    expect(dates[0]?.semester).toBe('h2')
  })
})

describe('formatUjatPreferredEducationDateDisplay', () => {
  it('ISO 달력일을 시안 형식 26년 M월 D일(요일)로 표시한다', () => {
    expect(formatUjatPreferredEducationDateDisplay('2026-04-24')).toBe('26년 4월 24일(금)')
    expect(formatUjatPreferredEducationDateDisplay('2026-11-20T00:00:00+09:00')).toBe(
      '26년 11월 20일(금)'
    )
  })

  it('이미 한글 표기면 원문을 유지한다', () => {
    expect(formatUjatPreferredEducationDateDisplay('26년 5월 8일(금)')).toBe('26년 5월 8일(금)')
  })
})

describe('buildUjatScheduleAssignDates', () => {
  it('연간 기간 일정 startAt을 열로 쓰지 않고 희망일만 펼친다', () => {
    const dates = buildUjatScheduleAssignDates({
      preferredIsoDates: ['2027-04-30', '2027-06-04'],
      schedules: [
        {
          id: 187220,
          startAt: '2027-02-28T15:00:00Z',
          endAt: '2027-12-31T14:59:59Z',
          startDate: '2027-03-01',
          endDate: '2027-12-31',
        },
      ],
    })

    expect(dates.map(entry => entry.isoDate)).toEqual(['2027-04-30', '2027-06-04'])
    expect(dates.every(entry => entry.scheduleId == null)).toBe(true)
  })

  it('희망일에 없는 GET 하루 행은 열로 추가하지 않는다', () => {
    const dates = buildUjatScheduleAssignDates({
      preferredIsoDates: ['2027-04-30'],
      schedules: [
        {
          id: 11,
          startAt: '2027-05-07T00:00:00+09:00',
          endAt: '2027-05-07T23:59:59+09:00',
          startDate: '2027-05-07',
          endDate: '2027-05-07',
        },
        {
          id: 111,
          startAt: '2027-04-29T15:00:00Z',
          endAt: '2027-04-30T15:00:00Z',
          startDate: '2027-04-30',
          endDate: '2027-04-30',
        },
      ],
    })

    expect(dates.map(entry => entry.isoDate)).toEqual(['2027-04-30'])
    expect(dates[0]?.scheduleId).toBe(111)
  })
})

describe('collectPreferredEducationIsoDates', () => {
  it('행 희망일 O만 모아 날짜 열을 만들고 기간 일정은 쓰지 않는다', () => {
    const isoDates = collectPreferredEducationIsoDates([
      {
        scheduleSlots: {
          '2027-04-30': 'O',
          '2027-06-04': 'O',
          '2027-03-01': '-',
        },
      },
      { scheduleSlots: { '2027-09-17': 'O', '2027-04-30': 'O' } },
    ])

    expect(isoDates).toEqual(['2027-04-30', '2027-06-04', '2027-09-17'])
    expect(scheduleColumnsFromIsoDates(isoDates).map(col => col.title)).toEqual([
      '4월 30일',
      '6월 4일',
      '9월 17일',
    ])
  })
})
