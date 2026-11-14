import { describe, expect, it } from 'vitest'
import {
  isMemberPreRegisterIdentityDuplicateError,
  isPreRegisterIdentityDuplicateApiError,
  MemberPreRegisterIdentityDuplicateError,
  PRE_REGISTER_IDENTITY_DUPLICATE_ALERT,
} from './pre-register-identity-duplicate-error'

function apiError(status: number, code: string, message: string) {
  return { response: { status, data: { success: false, error: { code, message, field: null } } } }
}

describe('pre-register identity duplicate', () => {
  it('409 ADMIN_IDENTITY_ALREADY_REGISTERED를 본인 정보 중복으로 본다', () => {
    expect(
      isPreRegisterIdentityDuplicateApiError(
        apiError(
          409,
          'ADMIN_IDENTITY_ALREADY_REGISTERED',
          '이미 관리자 계정으로 등록된 본인인증 정보입니다.'
        )
      )
    ).toBe(true)
  })

  it('이메일 중복·입력 검증은 본인 정보 중복이 아니다', () => {
    expect(
      isPreRegisterIdentityDuplicateApiError(
        apiError(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.')
      )
    ).toBe(false)
    expect(
      isPreRegisterIdentityDuplicateApiError(
        apiError(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.')
      )
    ).toBe(false)
  })

  it('화면용 오류는 관리자용 서버 문구가 아닌 회원용 안내를 담는다', () => {
    const error = new MemberPreRegisterIdentityDuplicateError()
    expect(isMemberPreRegisterIdentityDuplicateError(error)).toBe(true)
    expect(error.message).toBe(PRE_REGISTER_IDENTITY_DUPLICATE_ALERT.content)
    expect(error.message).not.toContain('관리자 계정')
  })
})
