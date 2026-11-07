import assert from 'node:assert/strict'
import { hasSocialConnectionConsent } from './has-social-connection-consent.ts'

assert.equal(
  hasSocialConnectionConsent({ summaries: [], hasLinkedAccount: true }),
  true,
)
assert.equal(
  hasSocialConnectionConsent({ summaries: [], hasLinkedAccount: false }),
  false,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'SOCIAL_CONNECTION', agreed: true }],
    hasLinkedAccount: false,
  }),
  true,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'social_connection', agreed: true }],
    hasLinkedAccount: false,
  }),
  true,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'SOCIAL_CONNECTION', agreed: false }],
    hasLinkedAccount: false,
  }),
  false,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'SOCIAL_CONNECTION', agreed: true, status: 'WITHDRAWN' }],
    hasLinkedAccount: false,
  }),
  false,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'SOCIAL_CONNECTION', agreed: true, expired: true }],
    hasLinkedAccount: false,
  }),
  false,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'SOCIAL_CONNECTION', agreed: true, reconsentRequired: true }],
    hasLinkedAccount: false,
  }),
  false,
)
assert.equal(
  hasSocialConnectionConsent({
    summaries: [{ consentType: 'MARKETING', agreed: true }],
    hasLinkedAccount: false,
  }),
  false,
)

console.log('has-social-connection-consent.selfcheck: ok')
