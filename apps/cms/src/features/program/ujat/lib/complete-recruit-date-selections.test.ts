import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { completeUjatRecruitDateSelections } from './complete-recruit-date-selections'

describe('completeUjatRecruitDateSelections', () => {
  it('봉사자 면접 기간을 반기 interviewRangeSeal에 맞춘다', () => {
    const completed = completeUjatRecruitDateSelections({
      'ujat.recruit.volunteer.h2.interviewRange': {
        start: '2026-11-20T00:00:00.000Z',
        end: '2026-11-22T00:00:00.000Z',
      },
      'recruit.volunteer.h2.interviewRangeSeal': {
        start: '2026-10-01T00:00:00.000Z',
        end: '2026-10-02T00:00:00.000Z',
      },
    })

    expect(completed['recruit.volunteer.h2.interviewRangeSeal']).toEqual({
      start: '2026-11-20T00:00:00.000Z',
      end: '2026-11-22T00:00:00.000Z',
    })
  })

  it('하반기 timeUnit이 없어도 슬롯 길이로 채운다', () => {
    const start = dayjs('2026-09-30T04:43:00.000Z')
    const mid = start.add(30, 'minute')
    const end = mid.add(30, 'minute')
    const completed = completeUjatRecruitDateSelections({
      'recruit.volunteer.h2.interview.selectedSlotKeys': [
        `${start.valueOf()}-${mid.valueOf()}`,
        `${mid.valueOf()}-${end.valueOf()}`,
      ],
      'recruit.volunteer.h2.interview.interviewTimeRange': [start, end],
    })

    expect(completed['recruit.volunteer.h2.interview.timeUnit']).toBe('30')
    expect(completed['recruit.volunteer.h2.interview.interviewTimeRange']).toEqual([
      start.toISOString(),
      end.toISOString(),
    ])
  })

  it('상반기 timeUnit은 그대로 두고 하반기만 채운다', () => {
    const completed = completeUjatRecruitDateSelections({
      'recruit.volunteer.h1.interview.timeUnit': '15',
      'recruit.volunteer.h2.interview.interviewTime': dayjs('2026-09-30T04:43:00.000Z'),
    })

    expect(completed['recruit.volunteer.h1.interview.timeUnit']).toBe('15')
    expect(completed['recruit.volunteer.h2.interview.timeUnit']).toBe('30')
    expect(completed['recruit.volunteer.h2.interview.interviewTime']).toBe(
      '2026-09-30T04:43:00.000Z'
    )
  })

  it('면접 기간 밖 selectedSlotKeys를 제거하고 interviewTimeRange를 재계산한다', () => {
    const inRange = dayjs('2026-11-21T01:00:00.000Z')
    const outRange = dayjs('2026-10-01T01:00:00.000Z')
    const inEnd = inRange.add(30, 'minute')
    const outEnd = outRange.add(30, 'minute')
    const completed = completeUjatRecruitDateSelections({
      'ujat.recruit.volunteer.h1.interviewRange': {
        start: '2026-11-20T00:00:00.000Z',
        end: '2026-11-22T00:00:00.000Z',
      },
      'recruit.volunteer.h1.interview.selectedSlotKeys': [
        `${outRange.valueOf()}-${outEnd.valueOf()}`,
        `${inRange.valueOf()}-${inEnd.valueOf()}`,
      ],
      'recruit.volunteer.h1.interview.interviewTimeRange': [
        outRange.toISOString(),
        inEnd.toISOString(),
      ],
    })

    expect(completed['recruit.volunteer.h1.interview.selectedSlotKeys']).toEqual([
      `${inRange.valueOf()}-${inEnd.valueOf()}`,
    ])
    expect(completed['recruit.volunteer.h1.interview.interviewTimeRange']).toEqual([
      inRange.toISOString(),
      inEnd.toISOString(),
    ])
  })
})
