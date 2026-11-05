import assert from 'node:assert/strict'
import {
  instructorApplyKeyToSettingsConsentItemId,
  PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY,
  PORTAL_RECEIPT_PRE_CONSENT_CREATE_TYPE,
  resolvePortalConsentCreateType,
  settingsConsentItemIdToInstructorKey,
  settingsConsentItemIdToWriteKey,
} from './settings-consent-key.ts'

assert.equal(
  settingsConsentItemIdToInstructorKey('paymentStatement'),
  'consentPaymentStatement',
)
assert.equal(
  instructorApplyKeyToSettingsConsentItemId('consentPaymentStatement'),
  'paymentStatement',
)
assert.equal(
  instructorApplyKeyToSettingsConsentItemId('consentAdministrativeJoint'),
  'administrativeJoint',
)
assert.equal(
  PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY.consentPaymentStatement,
  'PAYMENT_STATEMENT_PRE_CONSENT',
)
assert.equal(settingsConsentItemIdToWriteKey('receiptPreConsent'), 'consentReceiptPreConsent')
assert.equal(
  resolvePortalConsentCreateType('consentReceiptPreConsent'),
  PORTAL_RECEIPT_PRE_CONSENT_CREATE_TYPE,
)
assert.notEqual(
  resolvePortalConsentCreateType('consentReceiptPreConsent'),
  PORTAL_CONSENT_CREATE_TYPE_BY_INSTRUCTOR_KEY.consentPaymentStatement,
)

console.log('settings-consent-key.selfcheck: ok')
