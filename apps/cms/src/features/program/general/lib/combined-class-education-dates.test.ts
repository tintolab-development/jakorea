import { describe, expect, it } from 'vitest'
import {
  areCombinedClassEducationDateSetsEqual,
  canMergeCombinedClassByEducationDate,
  collectCombinedClassEducationDates,
  retainMatchingCombinedClassPartnerIds,
  toSeoulDateKey,
} from './combined-class-education-dates'

describe('toSeoulDateKey', () => {
  it('UTC 자정 직전은 한국 날짜로 넘긴다', () => {
    expect(toSeoulDateKey('2026-05-11T15:30:00.000Z')).toBe('2026-05-12')
  })

  it('이미 YYYY-MM-DD면 UTC 변환 없이 그대로 쓴다', () => {
    expect(toSeoulDateKey('2026-05-12')).toBe('2026-05-12')
  })

  it('같은 날 다른 시각은 같은 날짜다', () => {
    expect(toSeoulDateKey('2026-05-12T01:00:00.000Z')).toBe('2026-05-12')
    expect(toSeoulDateKey('2026-05-12T05:00:00.000Z')).toBe('2026-05-12')
  })
})

describe('collectCombinedClassEducationDates', () => {
  it('OSA sessions startAt을 희망일보다 우선한다', () => {
    expect(
      collectCombinedClassEducationDates({
        sessions: [{ startAt: '2026-05-12T01:00:00.000Z' }],
        preferredEducationSchedules: [{ startAt: '2026-05-13T01:00:00.000Z' }],
      })
    ).toEqual(['2026-05-12'])
  })

  it('OSA가 없으면 preferredEducationDates를 쓴다', () => {
    expect(
      collectCombinedClassEducationDates({
        preferredEducationDates: ['2026-05-12', '2026-05-12'],
        preferredEducationSchedules: [{ startAt: '2026-05-13T01:00:00.000Z' }],
      })
    ).toEqual(['2026-05-12'])
  })

  it('배정·preferredEducationDates가 없으면 희망 startAt을 쓴다', () => {
    expect(
      collectCombinedClassEducationDates({
        preferredEducationSchedules: [
          { startAt: '2026-05-12T01:00:00.000Z' },
          { startAt: '2026-05-12T05:00:00.000Z' },
        ],
      })
    ).toEqual(['2026-05-12'])
  })

  it('라벨만 있고 startAt이 없으면 빈 배열이다', () => {
    expect(
      collectCombinedClassEducationDates({
        preferredEducationSchedules: [{ startAt: null }],
      })
    ).toEqual([])
  })
})

describe('areCombinedClassEducationDateSetsEqual', () => {
  it('같은 날짜 집합만 허용하고 하루만 겹치면 거부한다', () => {
    expect(areCombinedClassEducationDateSetsEqual(['2026-05-12'], ['2026-05-12'])).toBe(true)
    expect(areCombinedClassEducationDateSetsEqual(['2026-05-12'], ['2026-05-13'])).toBe(false)
    expect(
      areCombinedClassEducationDateSetsEqual(['2026-05-12', '2026-05-13'], ['2026-05-12'])
    ).toBe(false)
    expect(areCombinedClassEducationDateSetsEqual([], [])).toBe(false)
  })
})

describe('canMergeCombinedClassByEducationDate', () => {
  it('OSA와 희망일이 같으면 합반할 수 있다', () => {
    expect(
      canMergeCombinedClassByEducationDate(
        { sessions: [{ startAt: '2026-05-12T01:00:00.000Z' }] },
        { preferredEducationSchedules: [{ startAt: '2026-05-12T05:00:00.000Z' }] }
      )
    ).toBe(true)
  })

  it('제출일 필드는 비교하지 않는다', () => {
    expect(
      canMergeCombinedClassByEducationDate(
        {
          sessions: [{ startAt: '2026-05-12T01:00:00.000Z' }],
        },
        {
          preferredEducationSchedules: [{ startAt: '2026-05-13T01:00:00.000Z' }],
        }
      )
    ).toBe(false)
  })
})

describe('retainMatchingCombinedClassPartnerIds', () => {
  it('교육일이 다른 선택을 제거한다', () => {
    expect(
      retainMatchingCombinedClassPartnerIds(
        { preferredEducationSchedules: [{ startAt: '2026-05-12T01:00:00.000Z' }] },
        [
          {
            id: 'a',
            preferredEducationSchedules: [{ startAt: '2026-05-12T05:00:00.000Z' }],
          },
          {
            id: 'b',
            preferredEducationSchedules: [{ startAt: '2026-05-13T01:00:00.000Z' }],
          },
        ],
        ['a', 'b']
      )
    ).toEqual(['a'])
  })
})
