import assert from 'node:assert/strict'
import { parseAuthTokenResponse } from './parse-auth-token.ts'

const over14 = parseAuthTokenResponse({
  accessToken: 'a',
  refreshToken: 'r',
  tokenType: 'Bearer',
  expiresInSeconds: 3600,
  passwordChangeRequired: false,
  adminProvisionedOnboardingRequired: false,
  adminProvisionedOnboardingStep: null,
  registeredByAdmin: false,
  identitySelfSignupCompletedAfterAdminRegistration: false,
  ageGroup: 'OVER_14',
})
assert.equal(over14.ageGroup, 'OVER_14')
assert.equal('under14' in over14, false)

const under14 = parseAuthTokenResponse({
  accessToken: 'a',
  refreshToken: 'r',
  ageGroup: 'UNDER_14',
})
assert.equal(under14.ageGroup, 'UNDER_14')

const missing = parseAuthTokenResponse({
  accessToken: 'a',
  refreshToken: 'r',
  ageGroup: null,
})
assert.equal(missing.ageGroup, undefined)

const empty = parseAuthTokenResponse({
  accessToken: 'a',
  refreshToken: 'r',
  ageGroup: '',
})
assert.equal(empty.ageGroup, undefined)

console.log('parse-auth-token.selfcheck: ok')
