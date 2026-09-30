import { describe, expect, it } from 'vitest'
import {
  extractApiErrorMessage,
  formatApiErrorAlertContent,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from './extract-api-error-message'

describe('extractApiErrorMessage', () => {
  it('top-level message를 서버 문자열 그대로 반환한다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        message: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS',
        error: { code: 'CONFLICT', message: 'ADMIN_EMAIL_ALREADY_EXISTS' },
      })
    ).toBe('CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS')
  })

  it('top-level message가 없으면 error.message를 그대로 반환한다', () => {
    expect(
      extractApiErrorMessage({
        error: { code: 'CONFLICT', message: 'ADMIN_EMAIL_ALREADY_EXISTS' },
      })
    ).toBe('ADMIN_EMAIL_ALREADY_EXISTS')
  })

  it('같은 모집 기간 코드는 서버 error.message를 구분해서 쓴다', () => {
    expect(
      extractApiErrorMessage({
        success: false,
        error: {
          code: 'PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED',
          message: '프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.',
        },
      })
    ).toBe('프로그램 운영이 시작된 이후에는 모집 정보를 수정할 수 없습니다.')
    expect(
      extractApiErrorMessage({
        success: false,
        error: {
          code: 'PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED',
          message: '모집 시작 이후에는 신청 양식을 수정할 수 없습니다.',
        },
      })
    ).toBe('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')
  })

  it('Alert 본문에 traceId를 붙이지 않는다', () => {
    expect(
      formatApiErrorAlertContent({
        message: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS',
        error: {
          code: 'CONFLICT',
          message: 'ADMIN_EMAIL_ALREADY_EXISTS',
          traceId: '665a7c8aa9a34fd59bac13d8beb969af',
        },
      })
    ).toBe('CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS')
  })
})

describe('getApiErrorCode / getApiErrorHttpStatus', () => {
  it('nested error.code와 HTTP status를 읽는다', () => {
    const error = {
      response: {
        status: 409,
        data: { error: { code: 'DETAILED_PROGRAM_IN_USE', message: '사용 중' } },
      },
    }
    expect(getApiErrorCode(error)).toBe('DETAILED_PROGRAM_IN_USE')
    expect(getApiErrorHttpStatus(error)).toBe(409)
  })
})
