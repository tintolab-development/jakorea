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

// QA-0137: 운영 JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false면 본문에 refreshToken이 없다 — 로그인은 깨지면 안 된다.
const cookieOnly = parseAuthTokenResponse({ accessToken: 'a', refreshToken: null, ageGroup: 'OVER_14' })
assert.equal(cookieOnly.accessToken, 'a')
assert.equal(cookieOnly.refreshToken, undefined)
assert.equal(parseAuthTokenResponse({ accessToken: 'a' }).refreshToken, undefined)
assert.equal(parseAuthTokenResponse({ accessToken: 'a', refreshToken: '  ' }).refreshToken, undefined)
assert.throws(() => parseAuthTokenResponse({ refreshToken: 'r' }))

console.log('parse-auth-token.selfcheck: ok')
