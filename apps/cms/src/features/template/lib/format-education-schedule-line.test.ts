import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  buildEducationScheduleLinesFromDateAndGroupTimes,
  countUniqueEducationScheduleCalendarDays,
  educationScheduleAppliedSurfaceRange,
  flattenGroupTimeSlotsByDetail,
  parseEducationScheduleLineToRange,
  rebuildEducationScheduleLinesFromGroupTimes,
} from '@/features/template/lib/format-education-schedule-line'

const april20 = dayjs('2026-04-20')

describe('buildEducationScheduleLinesFromDateAndGroupTimes', () => {
  it('그룹 2개면 같은 날짜에 시간 구간 두 줄을 만든다', () => {
    expect(
      buildEducationScheduleLinesFromDateAndGroupTimes(april20, [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '15:00' },
      ])
    ).toEqual([
      '26년 4월 20일(월) 9:00 ~ 12:00',
      '26년 4월 20일(월) 13:00 ~ 15:00',
    ])
  })

  it('시작 또는 종료가 비어 있는 슬롯은 건너뛴다', () => {
    expect(
      buildEducationScheduleLinesFromDateAndGroupTimes(april20, [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '' },
        null,
      ])
    ).toEqual(['26년 4월 20일(월) 9:00 ~ 12:00'])
  })

  it('슬롯이 모두 비면 날짜만 한 줄 추가한다', () => {
    expect(buildEducationScheduleLinesFromDateAndGroupTimes(april20, [])).toEqual([
      '26년 4월 20일(월)',
    ])
    expect(
      buildEducationScheduleLinesFromDateAndGroupTimes(april20, [{ startTime: '', endTime: '' }])
    ).toEqual(['26년 4월 20일(월)'])
  })
})

describe('rebuildEducationScheduleLinesFromGroupTimes', () => {
  it('날짜만 있는 줄에 그룹 시간을 나중에 입힌다', () => {
    expect(
      rebuildEducationScheduleLinesFromGroupTimes(
        ['26년 4월 20일(월)', '26년 4월 21일(화)'],
        [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '13:00', endTime: '15:00' },
        ]
      )
    ).toEqual([
      '26년 4월 20일(월) 9:00 ~ 12:00',
      '26년 4월 20일(월) 13:00 ~ 15:00',
      '26년 4월 21일(화) 9:00 ~ 12:00',
      '26년 4월 21일(화) 13:00 ~ 15:00',
    ])
  })

  it('이미 시간이 있는 줄을 수정된 그룹 시간으로 다시 만든다', () => {
    expect(
      rebuildEducationScheduleLinesFromGroupTimes(
        ['26년 4월 20일(월) 9:00 ~ 12:00', '26년 4월 20일(월) 13:00 ~ 15:00'],
        [{ startTime: '10:00', endTime: '11:00' }]
      )
    ).toEqual(['26년 4월 20일(월) 10:00 ~ 11:00'])
  })
})

describe('parseEducationScheduleLineToRange', () => {
  it('같은 날 시간 구간을 시작·종료 시각으로 복원한다', () => {
    const range = parseEducationScheduleLineToRange('26년 4월 20일(월) 9:30 ~ 12:20')
    expect(range?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 09:30')
    expect(range?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 12:20')
  })

  it('여러 날 기간과 시각을 복원한다', () => {
    const range = parseEducationScheduleLineToRange(
      '26년 4월 20일(월) 9:30 ~ 26년 4월 27일(월) 12:20'
    )
    expect(range?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 09:30')
    expect(range?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-27 12:20')
  })

  it('날짜만 있으면 시각 없이 같은 날을 반환한다', () => {
    const range = parseEducationScheduleLineToRange('26년 4월 20일(월)')
    expect(range?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 00:00')
    expect(range?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 00:00')
    expect(educationScheduleAppliedSurfaceRange(range)).toBeNull()
  })
})

describe('countUniqueEducationScheduleCalendarDays', () => {
  it('같은 날 슬롯 두 줄은 하루로 센다', () => {
    expect(
      countUniqueEducationScheduleCalendarDays([
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ])
    ).toBe(1)
  })

  it('다른 날 두 줄은 이틀로 센다', () => {
    expect(
      countUniqueEducationScheduleCalendarDays([
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ])
    ).toBe(2)
  })

  it('기간 줄은 시작일만 센다', () => {
    expect(
      countUniqueEducationScheduleCalendarDays([
        '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        '26년 5월 20일(수) ~ 26년 5월 27일(수)',
      ])
    ).toBe(2)
  })

  it('빈 목록은 0이다', () => {
    expect(countUniqueEducationScheduleCalendarDays([])).toBe(0)
    expect(countUniqueEducationScheduleCalendarDays(undefined)).toBe(0)
  })
})

describe('flattenGroupTimeSlotsByDetail', () => {
  it('세부 일정 번호 순으로 그룹 슬롯을 펼친다', () => {
    expect(
      flattenGroupTimeSlotsByDetail({
        2: [{ startTime: '13:00', endTime: '15:00' }],
        1: [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '10:00', endTime: '11:00' },
        ],
      })
    ).toEqual([
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '13:00', endTime: '15:00' },
    ])
  })
})
