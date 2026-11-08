import { describe, expect, it } from 'vitest'
import {
  buildEducationRecordYearOptions,
  getCurrentEducationRecordPeriod,
  withDefaultEducationRecordPeriod,
} from './education-record-default-period'

describe('education-record-default-period', () => {
  it('현재 연도와 분기를 계산한다', () => {
    expect(getCurrentEducationRecordPeriod(new Date(2026, 0, 1))).toEqual({ year: 2026, quarter: 1 })
    expect(getCurrentEducationRecordPeriod(new Date(2026, 5, 30))).toEqual({ year: 2026, quarter: 2 })
    expect(getCurrentEducationRecordPeriod(new Date(2026, 10, 9))).toEqual({ year: 2026, quarter: 4 })
  })

  it('년도·분기 쿼리가 없을 때만 초기값을 채운다', () => {
    const now = new Date(2026, 10, 9)
    const seeded = withDefaultEducationRecordPeriod(new URLSearchParams('tab=summary'), now)
    expect(seeded?.get('er_year')).toBe('2026')
    expect(seeded?.get('er_q')).toBe('4')
    expect(seeded?.get('tab')).toBe('summary')
    expect(withDefaultEducationRecordPeriod(new URLSearchParams('er_year=2024'), now)).toBeNull()
    expect(withDefaultEducationRecordPeriod(new URLSearchParams('er_q=2'), now)).toBeNull()
  })

  it('년도 선택지는 행 연도와 최근 5년을 합쳐 내림차순으로 만든다', () => {
    expect(buildEducationRecordYearOptions([2019, 2025], new Date(2026, 0, 1))).toEqual([
      2026, 2025, 2024, 2023, 2022, 2019,
    ])
  })
})
