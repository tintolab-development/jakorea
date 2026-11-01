import assert from 'node:assert/strict'
import { formatConsentAgreedAt, formatConsentDate } from './map-consents.ts'

assert.equal(formatConsentAgreedAt('2026-07-03T09:23:45'), '2026.07.03 09:23')
assert.equal(formatConsentAgreedAt('2026-07-03'), '2026.07.03')
assert.equal(formatConsentAgreedAt(undefined), undefined)
assert.equal(formatConsentAgreedAt('not-a-date'), undefined)
assert.equal(formatConsentAgreedAt('2026-10-31T07:30:08Z'), '2026.10.31 16:30')
assert.equal(formatConsentAgreedAt('2026-10-31T15:30:00Z'), '2026.11.01 00:30')
assert.equal(formatConsentAgreedAt('2026-10-31T16:30:08+09:00'), '2026.10.31 16:30')
assert.equal(formatConsentDate('2026-10-06T02:00:00Z'), '2026.10.06')
assert.equal(formatConsentDate('2026-10-31T15:30:00Z'), '2026.11.01')
assert.equal(formatConsentDate(null), undefined)

console.log('format-consent-agreed-at.selfcheck: ok')
