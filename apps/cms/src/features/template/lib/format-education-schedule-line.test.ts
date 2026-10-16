import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  buildEducationScheduleLinesFromDateAndGroupTimes,
  educationScheduleLinesFromSelectionRangeApply,
  countUniqueEducationScheduleCalendarDays,
  educationScheduleAppliedSurfaceRange,
  flattenGroupTimeSlotsByDetail,
  isEducationScheduleLineBeforeSeoulToday,
  isEducationScheduleLineUpcoming,
  parseEducationScheduleLineToRange,
  mergeUniqueEducationScheduleLines,
  rebuildEducationScheduleLinesFromGroupTimes,
  shiftEducationScheduleLineToDate,
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

describe('educationScheduleLinesFromSelectionRangeApply', () => {
  it('기간 지정 — 그룹 시간·range 시각과 무관하게 예정일은 날짜만', () => {
    const start = dayjs('2026-11-01T09:00:00')
    const end = dayjs('2026-11-05T18:00:00')
    expect(
      educationScheduleLinesFromSelectionRangeApply({
        range: [start, end],
        autoFillFromScheduleGroupTimes: true,
        educationScheduleMode: 'period',
        groupTimeSlots: [{ startTime: '09:00', endTime: '12:00' }],
        dateOnlyPeriodRange: false,
      })
    ).toEqual(['26년 11월 1일(일) ~ 26년 11월 5일(목)'])
  })

  it('개인 일정형 단일·날짜 지정 — range apply도 그룹 시간으로 예정일을 만든다', () => {
    const day = dayjs('2026-11-10')
    expect(
      educationScheduleLinesFromSelectionRangeApply({
        range: [day, day],
        autoFillFromScheduleGroupTimes: true,
        educationScheduleMode: 'date',
        groupTimeSlots: [
          { startTime: '13:30', endTime: '15:30' },
          { startTime: '09:30', endTime: '11:30' },
        ],
        dateOnlyPeriodRange: false,
      })
    ).toEqual([
      '26년 11월 10일(화) 13:30 ~ 15:30',
      '26년 11월 10일(화) 9:30 ~ 11:30',
    ])
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

describe('mergeUniqueEducationScheduleLines', () => {
  it('중복 줄은 넣지 않고 순서를 유지한다', () => {
    expect(
      mergeUniqueEducationScheduleLines(
        ['26년 4월 20일(월) 9:00 ~ 12:00'],
        ['26년 4월 20일(월) 9:00 ~ 12:00', '26년 4월 20일(월) 13:00 ~ 15:00']
      )
    ).toEqual([
      '26년 4월 20일(월) 9:00 ~ 12:00',
      '26년 4월 20일(월) 13:00 ~ 15:00',
    ])
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

describe('isEducationScheduleLineBeforeSeoulToday', () => {
  const now = new Date('2026-09-28T15:00:00+09:00')

  it('어제 일정만 지났다고 보고, 오늘·읽지 못한 줄은 유지한다', () => {
    expect(isEducationScheduleLineBeforeSeoulToday('26년 9월 27일(일)', now)).toBe(true)
    expect(isEducationScheduleLineBeforeSeoulToday('26년 9월 28일(월) 9:00 ~ 12:00', now)).toBe(
      false
    )
    expect(isEducationScheduleLineBeforeSeoulToday('일정 미정', now)).toBe(false)
  })
})

describe('shiftEducationScheduleLineToDate', () => {
  it('날짜만 옮기고 시각은 남긴다', () => {
    expect(
      shiftEducationScheduleLineToDate('26년 4월 20일(월) 9:30 ~ 12:20', dayjs('2026-05-01'))
    ).toBe('26년 5월 1일(금) 9:30 ~ 12:20')
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

describe('isEducationScheduleLineUpcoming', () => {
  const now = dayjs('2026-09-29T09:00:00')

  it('미래 날짜·시간은 예정이다', () => {
    expect(isEducationScheduleLineUpcoming('26년 10월 12일(월) 10:00 ~ 12:00', now)).toBe(true)
    expect(isEducationScheduleLineUpcoming('26년 10월 12일(월)', now)).toBe(true)
  })

  it('지난 날짜와 이미 시작한 일정은 예정이 아니다', () => {
    expect(isEducationScheduleLineUpcoming('26년 9월 20일(일) 10:00 ~ 12:00', now)).toBe(false)
    expect(isEducationScheduleLineUpcoming('26년 9월 29일(화) 8:00 ~ 10:00', now)).toBe(false)
    expect(isEducationScheduleLineUpcoming('26년 9월 20일(일) ~ 26년 9월 27일(일)', now)).toBe(
      false
    )
  })

  it('기간이 이미 시작됐으면 예정이 아니다', () => {
    expect(
      isEducationScheduleLineUpcoming('26년 9월 20일(일) ~ 26년 10월 12일(월)', now)
    ).toBe(false)
  })
})
