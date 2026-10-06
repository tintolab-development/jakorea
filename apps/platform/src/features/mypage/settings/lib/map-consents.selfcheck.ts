import assert from 'node:assert/strict'
import { BASIC_CONSENT_ITEMS, INSTRUCTOR_DOCUMENT_CONSENT_ITEMS } from './consent-catalog.ts'
import { formatConsentAgreedAt, mergeConsentItemsWithSummaries } from './map-consents.ts'

assert.equal(formatConsentAgreedAt('2026-07-03T09:23:45'), '2026.07.03 09:23')
assert.equal(formatConsentAgreedAt('2026-07-03'), '2026.07.03')
assert.equal(formatConsentAgreedAt(undefined), undefined)

const basic = mergeConsentItemsWithSummaries(BASIC_CONSENT_ITEMS, [
  { consentType: 'SERVICE_TERMS', agreed: true, agreedAt: '2026-09-01T10:00:00' },
  { consentType: 'PRIVACY_COLLECTION', agreed: true, agreedAt: '2026-09-01T10:00:00' },
  { consentType: 'MARKETING', agreed: false },
  { consentType: 'PORTRAIT_RIGHTS', agreed: true, expired: true, agreedAt: '2025-01-01T00:00:00' },
])
const byId = Object.fromEntries(basic.map(item => [item.id, item]))
assert.equal(byId.serviceTerms?.agreed, true)
assert.equal(byId.serviceTerms?.agreedAt, '2026.09.01 10:00')
assert.equal(byId.marketing?.agreed, false)
assert.equal(byId.marketing?.agreedAt, undefined)
assert.equal(byId.portrait?.agreed, false)
assert.equal(byId.portrait?.hint, '유효기간이 만료되어 재동의가 필요해요.')

const instructor = mergeConsentItemsWithSummaries(INSTRUCTOR_DOCUMENT_CONSENT_ITEMS, [
  { consentType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: true, agreedAt: '2026-08-01T08:00:00' },
  { consentType: 'FACILITATOR_PLEDGE', applicable: false },
])
assert.equal(instructor.find(item => item.id === 'paymentStatement')?.agreed, true)
assert.equal(instructor.some(item => item.id === 'educatorPledge'), false)
assert.equal(instructor.find(item => item.id === 'sexOffenseCheck')?.agreed, false)

console.log('map-consents.selfcheck: ok')
