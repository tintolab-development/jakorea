import assert from 'node:assert/strict'
import {
  buildConsentItemsFromSummaries,
  formatConsentAgreedAt,
  formatConsentDate,
} from './map-consents.ts'
import { filterBasicConsentItemsByAudience } from './consent-visibility.ts'

assert.equal(formatConsentAgreedAt('2026-07-03T09:23:45'), '2026.07.03 09:23')
assert.equal(formatConsentAgreedAt('2026-07-03'), '2026.07.03')
assert.equal(formatConsentAgreedAt(undefined), undefined)
assert.equal(formatConsentDate('2026-10-06T02:00:00Z'), '2026.10.06')
assert.equal(formatConsentDate(null), undefined)

const adult = buildConsentItemsFromSummaries([
  { consentType: 'SERVICE_TERMS', required: true, agreed: true, agreedAt: '2026-09-01T10:00:00' },
  { consentType: 'PRIVACY_COLLECTION', required: true, agreed: true, agreedAt: '2026-09-01T10:00:00' },
  { consentType: 'MARKETING', required: false, agreed: false },
  {
    consentType: 'PORTRAIT_RIGHTS',
    agreed: true,
    withdrawable: true,
    consentStatus: 'PARTIAL',
    programEligible: true,
    agreedAt: '2026-09-01T10:00:00',
  },
  { consentType: 'PAYMENT_STATEMENT_PRE_CONSENT', agreed: true, agreedAt: '2026-08-01T08:00:00' },
  { consentType: 'FACILITATOR_PLEDGE', applicable: false, agreed: false },
  { consentType: 'ADMINISTRATIVE_INFO_CONSENT', applicable: false, agreed: false },
  { consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', applicable: false, agreed: false },
  { consentType: 'UNKNOWN_FUTURE_TYPE', agreed: true },
])
assert.deepEqual(
  adult.basicItems.map(item => item.id),
  ['serviceTerms', 'privacyCollection', 'marketing', 'portrait'],
)
assert.deepEqual(
  adult.documentItems.map(item => item.id),
  ['paymentStatement', 'educatorPledge', 'administrativeJoint', 'sexOffenseCheck'],
)
const adultById = Object.fromEntries(
  [...adult.basicItems, ...adult.documentItems].map(item => [item.id, item]),
)
assert.equal(adultById.serviceTerms?.agreedAt, '2026.09.01 10:00')
assert.equal(adultById.serviceTerms?.withdrawable, false)
assert.equal(adultById.marketing?.agreed, false)
assert.equal(adultById.portrait?.withdrawable, true)
assert.equal(adultById.paymentStatement?.agreed, true)
assert.equal(adultById.paymentStatement?.withdrawable, true)
assert.equal(adultById.educatorPledge?.agreed, false)
assert.equal(adultById.educatorPledge?.withdrawable, false)

const writtenDocument = buildConsentItemsFromSummaries([
  { consentType: 'FACILITATOR_PLEDGE', agreed: false, documentId: 42, signed: true },
  { consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: false, status: 'COMPLETED' },
])
assert.equal(writtenDocument.documentItems.find(item => item.id === 'educatorPledge')?.agreed, true)
assert.equal(writtenDocument.documentItems.find(item => item.id === 'sexOffenseCheck')?.agreed, true)

const expired = buildConsentItemsFromSummaries([
  { consentType: 'PORTRAIT_RIGHTS', agreed: true, expired: true, agreedAt: '2025-01-01T00:00:00' },
])
assert.equal(expired.basicItems[0]?.agreed, false)
assert.equal(expired.basicItems[0]?.hint, '유효기간이 만료되어 재동의가 필요해요.')

const minorTeacher = buildConsentItemsFromSummaries([
  { consentType: 'SERVICE_TERMS', required: true, agreed: true },
  { consentType: 'TEACHER_INFO_COLLECTION', required: true, agreed: true },
  { consentType: 'GUARDIAN_CONSENT', required: true, agreed: true },
  { consentType: 'CHILD_PRIVACY_COLLECTION', required: false, agreed: true, withdrawable: true },
])
assert.deepEqual(
  minorTeacher.basicItems.map(item => item.id),
  ['serviceTerms', 'teacherInfo', 'guardianLegal', 'childPrivacy'],
)
assert.equal(minorTeacher.basicItems.find(item => item.id === 'childPrivacy')?.withdrawable, true)

const adultWithWrongTeacherRows = buildConsentItemsFromSummaries([
  { consentType: 'SERVICE_TERMS', required: true, agreed: true },
  { consentType: 'TEACHER_INFO_COLLECTION', required: true, agreed: true },
  { consentType: 'GUARDIAN_CONSENT', required: true, agreed: true },
  { consentType: 'CHILD_PRIVACY_COLLECTION', agreed: true },
])
const adultFiltered = filterBasicConsentItemsByAudience(adultWithWrongTeacherRows.basicItems, {
  isTeacher: false,
  isMinor: false,
})
assert.deepEqual(adultFiltered.map(item => item.id), ['serviceTerms'])

const hiddenByApplicable = buildConsentItemsFromSummaries([
  { consentType: 'TEACHER_INFO_COLLECTION', applicable: false, agreed: false },
])
assert.equal(hiddenByApplicable.basicItems.length, 0)

console.log('map-consents.selfcheck: ok')
