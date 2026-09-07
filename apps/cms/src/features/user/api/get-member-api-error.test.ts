import { describe, expect, it } from 'vitest'
import { getMemberApiErrorMessage } from './get-member-api-error'

describe('getMemberApiErrorMessage', () => {
  it('maps CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED when server message is empty', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'CMS_INDIVIDUAL_GRADE_REQUIRED_WHEN_ENROLLED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('학년')
  })

  it('maps CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'CMS_INDIVIDUAL_SCHOOL_NOT_ALLOWED_WHEN_NOT_ENROLLED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('미재학')
  })
})
