import { describe, expect, it } from 'vitest'
import { getGeneralProgramApiErrorMessage } from './get-general-program-api-error'

describe('getGeneralProgramApiErrorMessage', () => {
  it('business_start_date CONFLICT를 한글 안내로 변환한다', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message:
            'CONFLICT: Program can only be modified before business_start_date when no earlier schedule lock is available.',
          error: {
            code: 'CONFLICT',
            message:
              'Program can only be modified before business_start_date when no earlier schedule lock is available.',
          },
        },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toContain('사업 시작일')
  })

  it('일반 message를 그대로 노출한다', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Invalid field' },
      },
    }
    expect(getGeneralProgramApiErrorMessage(error, 'fallback')).toBe('Invalid field')
  })
})
