import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  buildEducationScheduleLinesFromDateAndGroupTimes,
  educationScheduleLinesFromSelectionRangeApply,
  countUniqueEducationScheduleCalendarDays,
  educationScheduleAppliedSurfaceRange,
  EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE,
  educationScheduleLineSerializationIssue,
  flattenGroupTimeSlotsByDetail,
  isCanonicalServerEducationScheduleLine,
  isEducationScheduleLineBeforeSeoulToday,
  canRemoveEducationSchedulePreviewLine,
  isEducationScheduleLineUpcoming,
  parseEducationScheduleLineForCms,
  parseEducationScheduleLineToRange,
  educationScheduleRangeFromPeriodLines,
  mergeUniqueEducationScheduleLines,
  rebuildEducationScheduleLinesFromGroupTimes,
  serializeEducationScheduleLineForServer,
  serializeEducationScheduleLinesForServer,
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
      '2026.04.20(월) 09:00 ~ 12:00',
      '2026.04.20(월) 13:00 ~ 15:00',
    ])
  })

  it('시작 또는 종료가 비어 있는 슬롯은 건너뛴다', () => {
    expect(
      buildEducationScheduleLinesFromDateAndGroupTimes(april20, [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '' },
        null,
      ])
    ).toEqual(['2026.04.20(월) 09:00 ~ 12:00'])
  })

  it('슬롯이 모두 비면 날짜만 한 줄 추가한다', () => {
    expect(buildEducationScheduleLinesFromDateAndGroupTimes(april20, [])).toEqual([
      '2026.04.20(월)',
    ])
    expect(
      buildEducationScheduleLinesFromDateAndGroupTimes(april20, [{ startTime: '', endTime: '' }])
    ).toEqual(['2026.04.20(월)'])
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
    ).toEqual(['2026.11.01(일) ~ 2026.11.05(목)'])
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
      '2026.11.10(화) 13:30 ~ 15:30',
      '2026.11.10(화) 09:30 ~ 11:30',
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
      '2026.04.20(월) 09:00 ~ 12:00',
      '2026.04.20(월) 13:00 ~ 15:00',
      '2026.04.21(화) 09:00 ~ 12:00',
      '2026.04.21(화) 13:00 ~ 15:00',
    ])
  })

  it('이미 시간이 있는 줄을 수정된 그룹 시간으로 다시 만든다', () => {
    expect(
      rebuildEducationScheduleLinesFromGroupTimes(
        ['26년 4월 20일(월) 9:00 ~ 12:00', '26년 4월 20일(월) 13:00 ~ 15:00'],
        [{ startTime: '10:00', endTime: '11:00' }]
      )
    ).toEqual(['2026.04.20(월) 10:00 ~ 11:00'])
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

  it('QA-126 compact 표기도 복원한다', () => {
    const sameDay = parseEducationScheduleLineToRange('2026.04.20(월) 09:30 ~ 12:20')
    expect(sameDay?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 09:30')
    expect(sameDay?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 12:20')
    const crossDay = parseEducationScheduleLineToRange(
      '2026.04.20(월) 09:30 ~ 2026.04.21(화) 12:20'
    )
    expect(crossDay?.[0].format('YYYY-MM-DD HH:mm')).toBe('2026-04-20 09:30')
    expect(crossDay?.[1].format('YYYY-MM-DD HH:mm')).toBe('2026-04-21 12:20')
  })
})

describe('educationScheduleRangeFromPeriodLines', () => {
  function seoulDay(iso: string): string {
    return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  }

  it('2026.11.11(수) 같은 날을 유효 기간으로 인정한다', () => {
    const range = educationScheduleRangeFromPeriodLines({
      mode: 'period',
      lines: ['2026.11.11(수)'],
    })
    expect(range).not.toBeNull()
    expect(seoulDay(range!.start)).toBe('2026-11-11')
    expect(seoulDay(range!.end)).toBe('2026-11-11')
  })

  it('점 표기 기간 줄을 시작·종료로 집계한다', () => {
    const range = educationScheduleRangeFromPeriodLines({
      mode: 'period',
      lines: ['2026.11.11(수) ~ 2026.11.18(수)'],
    })
    expect(seoulDay(range!.start)).toBe('2026-11-11')
    expect(seoulDay(range!.end)).toBe('2026-11-18')
  })

  it('여러 기간 줄은 최소 시작일~최대 종료일이다', () => {
    const range = educationScheduleRangeFromPeriodLines({
      mode: 'period',
      lines: ['2026.11.11(수) ~ 2026.11.13(금)', '2026.11.18(수) ~ 2026.11.20(금)'],
    })
    expect(seoulDay(range!.start)).toBe('2026-11-11')
    expect(seoulDay(range!.end)).toBe('2026-11-20')
  })

  it('date 모드이면 줄이 있어도 null이다', () => {
    expect(
      educationScheduleRangeFromPeriodLines({
        mode: 'date',
        lines: ['2026.11.11(수) ~ 2026.11.18(수)'],
      })
    ).toBeNull()
  })

  it('기간 줄이 비면 null이다', () => {
    expect(educationScheduleRangeFromPeriodLines({ mode: 'period', lines: [] })).toBeNull()
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
    ).toBe('2026.05.01(금) 09:30 ~ 12:20')
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

describe('canRemoveEducationSchedulePreviewLine', () => {
  const now = dayjs('2026-10-23T16:00:00')

  it('이미 시작한 예정일은 삭제할 수 없다', () => {
    expect(
      canRemoveEducationSchedulePreviewLine('2026.10.21(수) 13:30 ~ 15:30', now)
    ).toBe(false)
    expect(canRemoveEducationSchedulePreviewLine('26년 10월 21일(수)', now)).toBe(false)
  })

  it('아직 시작하지 않은 예정일은 삭제할 수 있다', () => {
    expect(
      canRemoveEducationSchedulePreviewLine('2026.11.04(수) 13:30 ~ 15:30', now)
    ).toBe(true)
  })

  it('등록 위저드는 지난 일정도 삭제할 수 있다', () => {
    expect(
      canRemoveEducationSchedulePreviewLine('2026.10.21(수) 13:30 ~ 15:30', now, {
        lockStartedLines: false,
      })
    ).toBe(true)
    expect(
      canRemoveEducationSchedulePreviewLine('26년 10월 23일(금) 13:30 ~ 15:30', now, {
        lockStartedLines: false,
      })
    ).toBe(true)
  })
})

describe('serializeEducationScheduleLineForServer', () => {
  it('CMS 표시를 서버 parseSlot·parsePeriod 형식으로 바꾼다', () => {
    expect(serializeEducationScheduleLineForServer('2026.11.06(금) 10:00 ~ 12:00')).toBe(
      '26년 11월 6일(금) 10:00 ~ 12:00'
    )
    expect(serializeEducationScheduleLineForServer('2026.11.06(금)')).toBe('26년 11월 6일(금)')
    expect(serializeEducationScheduleLineForServer('2026.11.06(금) ~ 2026.11.12(목)')).toBe(
      '26년 11월 6일(금) ~ 26년 11월 12일(목)'
    )
  })

  it('이미 서버 형식이면 다시 고치지 않고, 날짜만인 줄에 시간을 붙이지 않는다', () => {
    const server = '26년 11월 6일(금) 10:00 ~ 12:00'
    expect(serializeEducationScheduleLineForServer(server)).toBe(server)
    expect(serializeEducationScheduleLineForServer(`  ${server}  `)).toBe(server)
    expect(isCanonicalServerEducationScheduleLine(server)).toBe(true)
    expect(serializeEducationScheduleLineForServer('2026.11.06(금)')).not.toContain('00:00')
  })

  it('한 자리 월·일·시간과 자정·월말·연말·윤년을 달력 요일로 보존한다', () => {
    expect(serializeEducationScheduleLineForServer('2026.1.5(월) 9:00 ~ 12:00')).toBe(
      '26년 1월 5일(월) 9:00 ~ 12:00'
    )
    expect(serializeEducationScheduleLineForServer('2026.11.06(금) 00:00 ~ 00:00')).toBe(
      '26년 11월 6일(금) 00:00 ~ 00:00'
    )
    expect(serializeEducationScheduleLineForServer('2026.11.30(월)')).toBe('26년 11월 30일(월)')
    expect(serializeEducationScheduleLineForServer('2026.12.31(목)')).toBe('26년 12월 31일(목)')
    expect(serializeEducationScheduleLineForServer('2024.02.29(목) 10:00 ~ 12:00')).toBe(
      '24년 2월 29일(목) 10:00 ~ 12:00'
    )
    expect(serializeEducationScheduleLineForServer('2026.11.06(월) 10:00 ~ 12:00')).toBe(
      '26년 11월 6일(금) 10:00 ~ 12:00'
    )
  })

  it('잘못된 날짜·역전 시간·역전 기간·윤년이 아닌 2월 29일은 조용히 바꾸지 않는다', () => {
    const invalid = [
      '2026.02.29(일)',
      '2026.11.06(금) 12:00 ~ 10:00',
      '2026.11.12(목) ~ 2026.11.06(금)',
      '26년 11월 6일(월) 10:00 ~ 12:00',
    ]
    for (const line of invalid) {
      expect(serializeEducationScheduleLineForServer(line)).toBe(line)
      expect(educationScheduleLineSerializationIssue(line)).toBe(
        EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE
      )
    }
  })

  it('자유입력·요일 없는 기간·ISO 시각은 그대로 둔다', () => {
    for (const line of ['협의 후 확정', '2026.03.01 ~ 2026.12.31', '2026-06-10 10:00']) {
      expect(serializeEducationScheduleLineForServer(line)).toBe(line)
      expect(educationScheduleLineSerializationIssue(line)).toBeNull()
    }
  })

  it('여러 줄의 순서와 길이를 유지하고 직렬화는 멱등이다', () => {
    const lines = [
      '2026.11.06(금) 10:00 ~ 12:00',
      '2026.11.06(금) 13:00 ~ 15:00',
      '협의 후 확정',
      '',
    ]
    const once = serializeEducationScheduleLinesForServer(lines)
    expect(once).toEqual([
      '26년 11월 6일(금) 10:00 ~ 12:00',
      '26년 11월 6일(금) 13:00 ~ 15:00',
      '협의 후 확정',
      '',
    ])
    expect(serializeEducationScheduleLinesForServer(once)).toEqual(once)
  })

  it('조회 파싱은 서버 형식을 CMS 표시로 되돌리고 반복해도 같다', () => {
    const cms = '2026.11.06(금) 10:00 ~ 12:00'
    const server = serializeEducationScheduleLineForServer(cms)
    expect(parseEducationScheduleLineForCms(server)).toBe(cms)
    expect(parseEducationScheduleLineForCms(cms)).toBe(cms)
    expect(parseEducationScheduleLineForCms(parseEducationScheduleLineForCms(server))).toBe(cms)
    expect(serializeEducationScheduleLineForServer(parseEducationScheduleLineForCms(server))).toBe(
      server
    )
    expect(parseEducationScheduleLineForCms('26년 11월 6일(금)')).toBe('2026.11.06(금)')
    expect(parseEducationScheduleLineForCms('26년 11월 6일(금) ~ 26년 11월 12일(목)')).toBe(
      '2026.11.06(금) ~ 2026.11.12(목)'
    )
    expect(parseEducationScheduleLineForCms('협의 후 확정')).toBe('협의 후 확정')
  })
})
