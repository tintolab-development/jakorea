import assert from 'node:assert/strict'
import {
  classifyGuardianSignupStatus,
  createGuardianNiceIdempotencyKey,
  shouldSkipGuardianNiceStart,
} from './guardian-bridge-status.ts'

const now = Date.parse('2026-10-21T00:00:00.000Z')

assert.equal(
  classifyGuardianSignupStatus({ status: 'CONSENTED', identityVerified: true }, now),
  'consented',
)
assert.equal(
  classifyGuardianSignupStatus({ status: 'PENDING', identityVerified: true }, now),
  'needs_final_consent',
)
assert.equal(
  classifyGuardianSignupStatus({ status: 'PENDING', identityVerified: false }, now),
  'needs_nice',
)
assert.equal(
  classifyGuardianSignupStatus(
    { status: 'PENDING', identityVerified: true, expiresAt: '2026-10-20T23:59:59.000Z' },
    now,
  ),
  'expired',
)

assert.equal(shouldSkipGuardianNiceStart({ status: 'CONSENTED', identityVerified: true }, now), true)
assert.equal(shouldSkipGuardianNiceStart({ status: 'PENDING', identityVerified: true }, now), true)
assert.equal(shouldSkipGuardianNiceStart({ status: 'PENDING', identityVerified: false }, now), false)
assert.equal(createGuardianNiceIdempotencyKey(12), 'guardian-nice-12')

console.log('guardian-bridge-status.selfcheck: ok')
