import assert from 'node:assert/strict'
import {
  AGE14_NICE_IDENTITY_CALLBACK_PATH,
  AGE14_NICE_IDENTITY_FLOW,
  isAgeTransitionNiceReturnFailure,
} from './identity-callback-contract.ts'

assert.equal(AGE14_NICE_IDENTITY_CALLBACK_PATH, '/auth/age-transition/identity/callback')
assert.equal(AGE14_NICE_IDENTITY_FLOW, 'AGE14_TRANSITION')

const failed = new URLSearchParams(
  'sessionId=1&status=FAILED&flow=AGE14_TRANSITION&error=identity_verification_failed&errorCode=EXPECTED_PROFILE_MISMATCH',
)
assert.equal(isAgeTransitionNiceReturnFailure(failed), true)

const verified = new URLSearchParams('sessionId=1&status=VERIFIED&flow=AGE14_TRANSITION')
assert.equal(isAgeTransitionNiceReturnFailure(verified), false)

console.log('identity-callback-contract.selfcheck: ok')
