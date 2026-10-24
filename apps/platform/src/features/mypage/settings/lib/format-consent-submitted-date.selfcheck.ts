import assert from 'node:assert/strict'
import {
  CONSENT_A4_TEMPLATE_DATE_LABEL,
  formatConsentSubmittedDateLabel,
  resolveConsentA4PreviewDateLabel,
} from './format-consent-submitted-date.ts'

assert.equal(resolveConsentA4PreviewDateLabel('2026-10-23', false), CONSENT_A4_TEMPLATE_DATE_LABEL)
assert.equal(resolveConsentA4PreviewDateLabel(undefined, false), CONSENT_A4_TEMPLATE_DATE_LABEL)
assert.equal(resolveConsentA4PreviewDateLabel('2026-10-23T00:00:00', true), '2026년 10월 23일')
assert.equal(formatConsentSubmittedDateLabel('2026.07.03 09:23'), '2026년 07월 03일')

console.log('format-consent-submitted-date.selfcheck: ok')
