import assert from 'node:assert/strict'
import {
  isValidMemberPassword,
  MEMBER_PASSWORD_HELP_TEXT,
} from '../../../auth/sign-up/lib/password-policy.ts'

assert.equal(isValidMemberPassword('Ab1!xxxx'), true)
assert.equal(isValidMemberPassword('Abcdefgh1'), false)
assert.equal(MEMBER_PASSWORD_HELP_TEXT.includes('8자'), true)

console.log('change-password.selfcheck: ok')
