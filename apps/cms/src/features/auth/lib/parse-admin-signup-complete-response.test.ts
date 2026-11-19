import { describe, expect, it } from 'vitest'
import { parseAdminSignupCompleteResponse } from './parse-admin-signup-complete-response'

const valid = {
  adminId: 42,
  email: 'person@jakorea.org',
  status: 'PENDING_VERIFICATION',
  loginEnabled: false,
  nextStep: 'MASTER_ADMIN_APPROVAL_REQUIRED',
}

describe('parseAdminSignupCompleteResponse', () => {
  it('accepts a committed pending signup', () => {
    expect(parseAdminSignupCompleteResponse(valid, 'Person@jakorea.org')).toMatchObject({
      adminId: 42,
      email: 'person@jakorea.org',
      status: 'PENDING_VERIFICATION',
    })
  })

  it.each([
    [{ ...valid, adminId: undefined }, 'missing ID'],
    [{ ...valid, adminId: -1 }, 'invalid ID'],
    [{ ...valid, status: 'ACTIVE' }, 'unexpected status'],
    [{ ...valid, status: undefined }, 'missing status'],
    [{ ...valid, loginEnabled: true }, 'unexpected login enabled'],
    [{ ...valid, loginEnabled: undefined }, 'missing login policy'],
    [{ ...valid, nextStep: 'LOGIN' }, 'unexpected next step'],
    [{ ...valid, nextStep: undefined }, 'missing approval next step'],
    [{ ...valid, email: 'other@jakorea.org' }, 'mismatched email'],
    [{ ...valid, email: undefined }, 'missing email'],
  ])('rejects %s (%s) without showing a completed signup', (result, _caseName) => {
    expect(() => parseAdminSignupCompleteResponse(result, 'person@jakorea.org')).toThrow(
      '가입 완료 결과를 확인할 수 없습니다.'
    )
  })
})
