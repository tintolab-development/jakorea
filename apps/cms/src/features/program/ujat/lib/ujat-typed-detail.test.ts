import { describe, expect, it } from 'vitest'
import {
  applyStoredUjatTypedHalvesToOverlay,
  buildUjatTypedDetailForCreate,
  buildUjatTypedHalfPlanFromOverlay,
} from './ujat-typed-detail'

describe('ujat-typed-detail 변환', () => {
  it('excludeNone 과 특정 불가일이 같이 있으면 excludeNone 을 끈다(BE 검증 통과)', () => {
    const plan = buildUjatTypedHalfPlanFromOverlay(
      {
        'ujat.h1.event.range': { start: '2027-04-01', end: '2027-04-30' },
        'ujat.h1.eduSchedule.unavailableDates': ['2027-04-10', '2027-05-10', 'bad'],
        'ujat.h1.eduSchedule.exclusion': { excludeNone: true, excludeHoliday: true },
      },
      'h1'
    )
    const row = plan?.stages?.[0]?.rows?.[0]
    expect(row?.excludedDates).toEqual(['2027-04-10'])
    expect(row?.exclusion).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    })
    expect(row?.educationName).toBe('h1')
    expect(row?.educationMethod).toBe('LEGACY')
  })

  it('끝 날짜가 없거나 순서가 틀린 기간은 비운다', () => {
    const plan = buildUjatTypedHalfPlanFromOverlay(
      { 'ujat.h2.event.range': { start: '2027-10-01', end: null }, 'ujat.h2.event.name': '하반기' },
      'h2'
    )
    expect(plan?.stages?.[0]?.rows?.[0]).toMatchObject({ startDate: null, endDate: null })
  })

  it('반기 값이 하나도 없으면 반기 계획을 만들지 않는다', () => {
    expect(buildUjatTypedDetailForCreate({ 'ujat.basicInfo.repKo': 'x' })).toEqual({
      schemaVersion: 1,
      halfPlans: [],
    })
  })

  it('조회 — typed 가 없으면 overlay 그대로(같은 객체)', () => {
    const overlay = { 'ujat.h1.event.name': 'a' }
    expect(applyStoredUjatTypedHalvesToOverlay(overlay, null)).toBe(overlay)
  })
})
