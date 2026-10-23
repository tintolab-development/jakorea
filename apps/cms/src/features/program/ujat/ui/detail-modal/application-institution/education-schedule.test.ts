import { describe, expect, it } from 'vitest'
import {
  buildUjatProgramScheduleDates,
  collectPreferredEducationIsoDates,
  formatScheduleColumnTitle,
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
