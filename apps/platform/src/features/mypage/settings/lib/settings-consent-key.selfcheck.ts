import assert from 'node:assert/strict'
import {
  PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY,
  settingsConsentItemIdToInstructorKey,
} from './settings-consent-key.ts'

assert.equal(
  settingsConsentItemIdToInstructorKey('paymentStatement'),
  'consentPaymentStatement',
)
assert.equal(
  PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY.consentPaymentStatement,
  'PAYMENT_STATEMENT_PRE_CONSENT',
)

console.log('settings-consent-key.selfcheck: ok')
