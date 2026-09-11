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

  it('maps INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED' },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('JA 강사 등급 정책')
  })

  it('maps INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM over generic 409 message', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          error: {
            code: 'INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM',
            message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          },
        },
      },
    }
    expect(getMemberApiErrorMessage(error, 'fallback')).toContain('참여 중인 프로그램')
  })
})
