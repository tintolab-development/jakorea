import { describe, expect, it } from 'vitest'
import { getDataManagementApiErrorMessage } from './get-data-management-api-error'

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
})
