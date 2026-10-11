import { describe, expect, it } from 'vitest'
import { queryKeys } from './query-keys'

describe('ujat queryKeys volunteer1365Attendance', () => {
  it('programId별 1365 출석 prefix 무효화 키', () => {
    expect(queryKeys.volunteer1365AttendanceAll('99')).toEqual([
      'cms',
      'programs',
      'ujat',
      'volunteer-1365-attendance',
      '99',
    ])
  })

  it('상세 쿼리 키는 half·일정 목록을 포함', () => {
    expect(queryKeys.volunteer1365Attendance('99', 'h1', '10,11')).toEqual([
      'cms',
      'programs',
      'ujat',
      'volunteer-1365-attendance',
      '99',
      'h1',
      '10,11',
    ])
  })
})
