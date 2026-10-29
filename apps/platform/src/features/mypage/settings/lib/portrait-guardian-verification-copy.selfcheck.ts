import assert from 'node:assert/strict'
import {
  formatPortraitGuardianVerifiedDate,
  PORTRAIT_GUARDIAN_INFO_COPY,
  validatePortraitGuardianRelation,
} from './portrait-guardian-verification-copy.ts'

assert.equal(
  validatePortraitGuardianRelation(''),
  PORTRAIT_GUARDIAN_INFO_COPY.relationRequiredMessage
)
assert.equal(
  validatePortraitGuardianRelation('   '),
  PORTRAIT_GUARDIAN_INFO_COPY.relationRequiredMessage
)
assert.equal(validatePortraitGuardianRelation('어머니'), null)

assert.equal(formatPortraitGuardianVerifiedDate('2026-10-29T10:00:00+09:00'), '2026.10.29')
// UTC 15:00 = KST 다음날 00:00
assert.equal(formatPortraitGuardianVerifiedDate('2026-10-29T15:00:00Z'), '2026.10.30')
assert.equal(formatPortraitGuardianVerifiedDate('2026-10-29T14:59:59Z'), '2026.10.29')
assert.equal(formatPortraitGuardianVerifiedDate(''), null)
assert.equal(formatPortraitGuardianVerifiedDate('invalid'), null)
assert.equal(formatPortraitGuardianVerifiedDate(undefined), null)

console.log('portrait-guardian-verification-copy.selfcheck: ok')
