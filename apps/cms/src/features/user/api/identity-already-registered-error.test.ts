import { describe, expect, it } from 'vitest'
import {
  IdentityAlreadyRegisteredError,
  isAdminIdentityAlreadyRegisteredApiError,
  isIdentityAlreadyRegisteredError,
  isPreRegisterIdentityDuplicateApiError,
} from './identity-already-registered-error'

function apiError(status: number, code: string, message: string) {
  return { response: { status, data: { success: false, error: { code, message, field: null } } } }
}

const DUPLICATE = apiError(
  409,
  'ADMIN_IDENTITY_ALREADY_REGISTERED',
  '이미 관리자 계정으로 등록된 본인인증 정보입니다.'
)

describe('identity already registered', () => {
  it('관리자 등록·사전등록 409 ADMIN_IDENTITY_ALREADY_REGISTERED를 본인 정보 중복으로 본다', () => {
    expect(isAdminIdentityAlreadyRegisteredApiError(DUPLICATE)).toBe(true)
    expect(isPreRegisterIdentityDuplicateApiError(DUPLICATE)).toBe(true)
  })

  it('이메일 중복·입력 검증은 본인 정보 중복이 아니다', () => {
    for (const error of [
      apiError(409, 'ADMIN_EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.'),
      apiError(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.'),
      apiError(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.'),
    ]) {
      expect(isAdminIdentityAlreadyRegisteredApiError(error)).toBe(false)
      expect(isPreRegisterIdentityDuplicateApiError(error)).toBe(false)
    }
  })

  it('화면용 오류 타입을 구분한다', () => {
    expect(isIdentityAlreadyRegisteredError(new IdentityAlreadyRegisteredError('admin'))).toBe(true)
    expect(isIdentityAlreadyRegisteredError(new Error('x'))).toBe(false)
  })
})
