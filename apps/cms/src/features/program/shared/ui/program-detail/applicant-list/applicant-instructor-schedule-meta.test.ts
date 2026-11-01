import { describe, expect, it } from 'vitest'
import {
  getInstructorScheduleDispatchStats,
  isInstructorLongDistance,
} from './applicant-instructor-schedule-meta'

describe('isInstructorLongDistance', () => {
  it('returns true only when BE longDistanceYn is true', () => {
    expect(isInstructorLongDistance({ longDistanceYn: true })).toBe(true)
  })

  it('returns false when BE value is missing or false', () => {
    expect(isInstructorLongDistance({})).toBe(false)
    expect(isInstructorLongDistance({ longDistanceYn: null })).toBe(false)
    expect(isInstructorLongDistance({ longDistanceYn: undefined })).toBe(false)
    expect(isInstructorLongDistance({ longDistanceYn: false })).toBe(false)
  })
})

describe('getInstructorScheduleDispatchStats', () => {
  it('returns zeros when API counts are missing', () => {
    expect(getInstructorScheduleDispatchStats()).toEqual({
      dispatchCount: 0,
      longDistanceCount: 0,
    })
  })

  it('maps programDispatchCount and programLongDistanceDispatchCount', () => {
    expect(
      getInstructorScheduleDispatchStats({
        programDispatchCount: 4,
        programLongDistanceDispatchCount: 1,
      })
    ).toEqual({
      dispatchCount: 4,
      longDistanceCount: 1,
    })
  })
})
