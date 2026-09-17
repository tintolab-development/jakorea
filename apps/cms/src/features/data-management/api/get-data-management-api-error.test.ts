import { describe, expect, it } from 'vitest'
import {
  getDataManagementApiErrorMessage,
  getDetailedProgramBusinessAreaFieldError,
} from './get-data-management-api-error'

describe('getDataManagementApiErrorMessage', () => {
  it('maps SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED when server message is empty', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED' },
        },
      },
    }
    expect(getDataManagementApiErrorMessage(error, 'fallback')).toContain('지원하지 않는 후원 상태')
  })

  it('prefers server message for SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'SPONSOR_SPONSORSHIP_STATUS_UNSUPPORTED',
            message: '서버 메시지',
          },
        },
      },
    }
    expect(getDataManagementApiErrorMessage(error, 'fallback')).toBe('서버 메시지')
  })

  it('maps TEXTBOOK_BUSINESS_AREA_NOT_FOUND', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'TEXTBOOK_BUSINESS_AREA_NOT_FOUND' },
        },
      },
    }
    expect(getDataManagementApiErrorMessage(error, 'fallback')).toContain('사업 분야')
  })
})

describe('getDetailedProgramBusinessAreaFieldError', () => {
  it('returns field message for TEXTBOOK_BUSINESS_AREA_NOT_FOUND', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'TEXTBOOK_BUSINESS_AREA_NOT_FOUND', field: 'businessArea' },
        },
      },
    }
    expect(getDetailedProgramBusinessAreaFieldError(error)).toContain('사업 분야')
  })

  it('returns field message for legacy UNKNOWN_BUSINESS_AREA_NAME', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'UNKNOWN_BUSINESS_AREA_NAME' },
        },
      },
    }
    expect(getDetailedProgramBusinessAreaFieldError(error)).toContain('사업 분야')
  })

  it('returns null for unrelated errors', () => {
    const error = {
      response: {
        status: 500,
        data: { success: false, error: { code: 'INTERNAL' } },
      },
    }
    expect(getDetailedProgramBusinessAreaFieldError(error)).toBeNull()
  })
})
