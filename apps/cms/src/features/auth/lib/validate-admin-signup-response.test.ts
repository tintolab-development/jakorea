import { describe, expect, it } from 'vitest'
import { AdminRegisterApiError } from '@/features/auth/model/admin-register-api.types'
import { validateAdminSignupCompletion } from './validate-admin-signup-response'

const valid = {
  adminId: 23,
  email: 'member@example.org',
  status: 'PENDING_VERIFICATION',
  loginEnabled: false,
  nextStep: 'MASTER_ADMIN_APPROVAL_REQUIRED',
} as const

describe('validateAdminSignupCompletion', () => {
  it('accepts only a newly created pending administrator with matching email', () => {
    expect(validateAdminSignupCompletion(valid, ' MEMBER@example.org ')).toBe(23)
  })

  it.each([
    { label: 'missing administrator ID', data: { ...valid, adminId: undefined } },
    { label: 'invalid administrator ID', data: { ...valid, adminId: -1 } },
    { label: 'active rather than pending status', data: { ...valid, status: 'ACTIVE' } },
    { label: 'unexpected login enabled state', data: { ...valid, loginEnabled: true } },
    { label: 'unknown workflow next step', data: { ...valid, nextStep: 'LOGIN' } },
    { label: 'different email', data: { ...valid, email: 'other@example.org' } },
    { label: 'missing email', data: { ...valid, email: undefined } },
  ])('rejects malformed successful responses: $label', ({ data }) => {
    expect(() => validateAdminSignupCompletion(data, valid.email))
      .toThrowError(AdminRegisterApiError)
  })

  it('rejects a successful HTTP envelope without a status instead of navigating', () => {
    expect(() => validateAdminSignupCompletion({ adminId: 11 }, valid.email))
      .toThrow('회원가입 완료 결과를 확인하지 못했습니다.')
  })
})
