import { describe, expect, it } from 'vitest'
import {
  buildScheduleIdByIsoDateMap,
  isExactDayProgramSchedule,
  resolveScheduleIdForIsoDate,
} from './temporary-schedule-api'

const YEAR_RANGE = {
  id: 187220,
  startAt: '2027-02-28T15:00:00Z',
  endAt: '2027-12-31T14:59:59Z',
  startDate: '2027-03-01',
  endDate: '2027-12-31',
  scheduleOrigin: 'PROGRAM_DEFINED',
}

const FRIDAY_APR_30 = {
  id: 111,
  startAt: '2027-04-29T15:00:00Z',
  endAt: '2027-04-30T15:00:00Z',
  startDate: '2027-04-30',
  endDate: '2027-04-30',
}

const FRIDAY_JUN_04 = {
  id: 222,
  startAt: '2027-06-03T15:00:00Z',
  endAt: '2027-06-04T15:00:00Z',
  startDate: '2027-06-04',
  endDate: '2027-06-04',
}

describe('isExactDayProgramSchedule', () => {
  it('기간 버킷은 하루짜리가 아니다', () => {
    expect(isExactDayProgramSchedule(YEAR_RANGE)).toBe(false)
  })

  it('all-day exclusive endAt이어도 startDate===endDate면 하루 행이다', () => {
    expect(isExactDayProgramSchedule(FRIDAY_APR_30)).toBe(true)
  })
})

describe('resolveScheduleIdForIsoDate', () => {
  it('연간 기간 id를 희망 금요일에 쓰지 않는다', () => {
    expect(resolveScheduleIdForIsoDate([YEAR_RANGE], '2027-04-30')).toBeNull()
  })

  it('startDate가 같은 하루 행 id만 반환한다', () => {
    expect(
      resolveScheduleIdForIsoDate([YEAR_RANGE, FRIDAY_APR_30, FRIDAY_JUN_04], '2027-04-30')
    ).toBe(111)
    expect(
      resolveScheduleIdForIsoDate([YEAR_RANGE, FRIDAY_APR_30, FRIDAY_JUN_04], '2027-06-04')
    ).toBe(222)
  })
})

describe('buildScheduleIdByIsoDateMap', () => {
  it('기간 행을 키로 넣지 않고 하루 행만 매핑한다', () => {
    const map = buildScheduleIdByIsoDateMap(
      [YEAR_RANGE, FRIDAY_APR_30, FRIDAY_JUN_04],
      ['2027-04-30', '2027-06-04']
    )
    expect(map.get('2027-03-01')).toBeUndefined()
    expect(map.get('2027-04-30')).toBe(111)
    expect(map.get('2027-06-04')).toBe(222)
  })

  it('preferred scheduleId는 GET 하루 행 id일 때만 우선한다', () => {
    const map = buildScheduleIdByIsoDateMap(
      [YEAR_RANGE, FRIDAY_APR_30],
      ['2027-04-30'],
      { '2027-04-30': 187220 }
    )
    expect(map.get('2027-04-30')).toBe(111)
  })
})
