import assert from 'node:assert/strict'
import { parseMemberGuardianVerificationApiError } from '../api/guardian-verification-api-error.ts'
import {
  interpretMemberGuardianVerificationGet,
  PortraitGuardianVerificationUnavailableError,
} from './interpret-member-guardian-verification.ts'

const verified = interpretMemberGuardianVerificationGet({
  status: 'VERIFIED',
  verifiedAt: '2026-10-30T05:00:00+09:00',
  verificationToken: 'one-time-token',
})
assert.equal(verified.kind, 'verified')
if (verified.kind === 'verified') {
  assert.equal(verified.result.verifiedAt, '2026-10-30T05:00:00+09:00')
  assert.equal(verified.result.verificationToken, 'one-time-token')
}

const verifiedNoToken = interpretMemberGuardianVerificationGet({
  status: 'VERIFIED',
  verifiedAt: '2026-10-30T05:00:00+09:00',
})
assert.equal(verifiedNoToken.kind, 'failed')

const pending = interpretMemberGuardianVerificationGet({ status: 'NICE_STARTED' })
assert.equal(pending.kind, 'pending')

const mismatch = interpretMemberGuardianVerificationGet({
  status: 'FAILED',
  failureCode: 'GUARDIAN_IDENTITY_MISMATCH',
})
assert.equal(mismatch.kind, 'failed')
if (mismatch.kind === 'failed') {
  assert.equal(mismatch.error instanceof PortraitGuardianVerificationUnavailableError, true)
  assert.match(mismatch.error.message, /보호자/)
  assert.equal(mismatch.error.message.includes('one-time-token'), false)
}

const adult = interpretMemberGuardianVerificationGet({
  status: 'FAILED',
  failureCode: 'GUARDIAN_NOT_ADULT',
})
assert.equal(adult.kind, 'failed')

const expired = interpretMemberGuardianVerificationGet({ status: 'EXPIRED' })
assert.equal(expired.kind, 'failed')

const apiError = parseMemberGuardianVerificationApiError(
  {
    success: false,
    error: { code: 'GUARDIAN_NOT_REGISTERED', message: '등록된 보호자가 없습니다.' },
  },
  409,
)
assert.equal(apiError.code, 'GUARDIAN_NOT_REGISTERED')
assert.equal(apiError.message, '등록된 보호자가 없습니다.')
assert.equal(apiError.httpStatus, 409)

console.log('portrait-guardian-verification.selfcheck: ok')
