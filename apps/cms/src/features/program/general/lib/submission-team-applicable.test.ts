import { describe, expect, it } from 'vitest'
import {
  isSubmissionTeamApplicable,
  isSubmissionTeamNotApplicableError,
} from './submission-team-applicable'

describe('isSubmissionTeamApplicable', () => {
  it('기업가정신·entrepreneur 계열만 허용한다', () => {
    expect(isSubmissionTeamApplicable('기업가정신')).toBe(true)
    expect(isSubmissionTeamApplicable('ENTREPRENEURSHIP')).toBe(true)
    expect(isSubmissionTeamApplicable('entrepreneurship')).toBe(true)
  })

  it('그 외 사업분야·빈 값은 허용하지 않는다', () => {
    expect(isSubmissionTeamApplicable('진로취업')).toBe(false)
    expect(isSubmissionTeamApplicable('경제금융')).toBe(false)
    expect(isSubmissionTeamApplicable('디지털리터러시')).toBe(false)
    expect(isSubmissionTeamApplicable('')).toBe(false)
    expect(isSubmissionTeamApplicable(null)).toBe(false)
    expect(isSubmissionTeamApplicable(undefined)).toBe(false)
  })
})

describe('isSubmissionTeamNotApplicableError', () => {
  it('TEAM_FEATURE_NOT_APPLICABLE 응답만 판별한다', () => {
    const notApplicable = {
      response: {
        status: 409,
        data: { success: false, error: { code: 'TEAM_FEATURE_NOT_APPLICABLE' } },
      },
    }
    const revisionConflict = {
      response: {
        status: 409,
        data: { success: false, error: { code: 'TEAM_MEMBERSHIP_REVISION_CONFLICT' } },
      },
    }
    expect(isSubmissionTeamNotApplicableError(notApplicable)).toBe(true)
    expect(isSubmissionTeamNotApplicableError(revisionConflict)).toBe(false)
    expect(isSubmissionTeamNotApplicableError(new Error('x'))).toBe(false)
  })
})
