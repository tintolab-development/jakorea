import { describe, expect, it } from 'vitest'
import { matchesInstructorJaExperienceYears } from './instructor-application-filter-options'

describe('matchesInstructorJaExperienceYears', () => {
  it('전체 선택 시 모두 통과한다', () => {
    expect(matchesInstructorJaExperienceYears(0, 'all')).toBe(true)
    expect(matchesInstructorJaExperienceYears(25, undefined)).toBe(true)
  })

  it('구간별로 경력 연수를 매칭한다', () => {
    expect(matchesInstructorJaExperienceYears(0, 'lt1')).toBe(true)
    expect(matchesInstructorJaExperienceYears(1, 'lt1')).toBe(false)

    expect(matchesInstructorJaExperienceYears(1, '1-5')).toBe(true)
    expect(matchesInstructorJaExperienceYears(5, '1-5')).toBe(true)
    expect(matchesInstructorJaExperienceYears(6, '1-5')).toBe(false)

    expect(matchesInstructorJaExperienceYears(6, '6-10')).toBe(true)
    expect(matchesInstructorJaExperienceYears(10, '6-10')).toBe(true)

    expect(matchesInstructorJaExperienceYears(11, '11-15')).toBe(true)
    expect(matchesInstructorJaExperienceYears(15, '11-15')).toBe(true)

    expect(matchesInstructorJaExperienceYears(16, '16-20')).toBe(true)
    expect(matchesInstructorJaExperienceYears(20, '16-20')).toBe(true)

    expect(matchesInstructorJaExperienceYears(20, '20+')).toBe(true)
    expect(matchesInstructorJaExperienceYears(21, '20+')).toBe(true)
  })
})
