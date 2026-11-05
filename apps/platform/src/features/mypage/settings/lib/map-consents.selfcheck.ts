import assert from 'node:assert/strict'
import {
  buildConsentItemsFromSummaries,
  formatConsentAgreedAt,
  formatConsentDate,
} from './map-consents.ts'
import { canWithdrawConsent } from './consent-withdraw.ts'
import { filterBasicConsentItemsByAudience } from './consent-visibility.ts'

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
  {
    consentType: 'PAYMENT_STATEMENT_PRE_CONSENT',
    agreed: true,
    withdrawable: true,
    agreedAt: '2026-08-01T08:00:00',
  },
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
assert.equal(adult.documentItems.some(item => item.id === 'receiptPreConsent'), false)

const receiptOnly = buildConsentItemsFromSummaries([
  {
    consentType: 'AGREEMENT_RECEIPT_PRE_CONSENT',
    agreed: true,
    signed: true,
    listed: false,
    documentId: 55,
    agreedAt: '2026-09-01T10:00:00',
  },
  { consentType: 'PAYMENT_STATEMENT_CONSENT', agreed: true, signed: true, listed: true, documentId: 9 },
  { consentType: 'PORTRAIT_RIGHTS', agreed: true, listed: null },
])
assert.equal(receiptOnly.documentItems.find(item => item.id === 'receiptPreConsent')?.agreed, true)
assert.equal(receiptOnly.documentItems.find(item => item.id === 'receiptPreConsent')?.signed, true)
assert.equal(receiptOnly.documentItems.find(item => item.id === 'receiptPreConsent')?.listed, false)
assert.equal(receiptOnly.documentItems.find(item => item.id === 'receiptPreConsent')?.documentId, 55)
assert.equal(receiptOnly.documentItems.find(item => item.id === 'paymentStatement')?.documentId, 9)
assert.equal(receiptOnly.documentItems.find(item => item.id === 'paymentStatement')?.listed, true)
assert.equal(
  receiptOnly.basicItems.find(item => item.id === 'portrait')?.listed,
  undefined,
)
assert.equal(adultById.educatorPledge?.agreed, false)
assert.equal(adultById.educatorPledge?.withdrawable, false)

const writtenDocument = buildConsentItemsFromSummaries([
  { consentType: 'FACILITATOR_PLEDGE', agreed: false, documentId: 42, signed: true },
  { consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: false, status: 'COMPLETED' },
])
assert.equal(writtenDocument.documentItems.find(item => item.id === 'educatorPledge')?.agreed, true)
assert.equal(writtenDocument.documentItems.find(item => item.id === 'sexOffenseCheck')?.agreed, true)

const draftDocument = buildConsentItemsFromSummaries([
  {
    consentType: 'FACILITATOR_PLEDGE',
    agreed: false,
    signed: false,
    status: 'DRAFT',
    documentId: 1694356,
    reconsentRequired: true,
  },
])
assert.equal(draftDocument.documentItems.find(item => item.id === 'educatorPledge')?.agreed, false)

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

const withdrawnPledge = buildConsentItemsFromSummaries([
  {
    consentType: 'FACILITATOR_PLEDGE',
    agreed: false,
    status: 'WITHDRAWN',
    withdrawable: false,
    documentId: 9,
  },
])
const withdrawnItem = withdrawnPledge.documentItems.find(item => item.id === 'educatorPledge')
assert.equal(withdrawnItem?.agreed, false)
assert.equal(withdrawnItem?.withdrawable, false)
assert.equal(canWithdrawConsent(withdrawnItem ?? {}), false)

const activeProgramPortrait = buildConsentItemsFromSummaries([
  {
    consentType: 'PORTRAIT_RIGHTS',
    agreed: true,
    status: 'AGREED',
    withdrawable: true,
    participationRestricted: true,
    paymentRestricted: false,
    documentId: null,
  },
])
const portrait = activeProgramPortrait.basicItems.find(item => item.id === 'portrait')
assert.equal(portrait?.agreed, true)
assert.equal(portrait?.withdrawable, true)
assert.equal(canWithdrawConsent(portrait ?? {}), true)

const signedButServerNotWithdrawable = buildConsentItemsFromSummaries([
  {
    consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    agreed: true,
    signed: true,
    status: 'SIGNED',
    withdrawable: false,
    documentId: 77,
  },
])
assert.equal(
  canWithdrawConsent(
    signedButServerNotWithdrawable.documentItems.find(item => item.id === 'administrativeJoint') ??
      {},
  ),
  false,
)

const currentPolicySigned = buildConsentItemsFromSummaries([
  {
    consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    agreed: true,
    signed: true,
    status: 'SIGNED',
    withdrawable: true,
    documentId: 77,
  },
])
assert.equal(
  canWithdrawConsent(
    currentPolicySigned.documentItems.find(item => item.id === 'administrativeJoint') ?? {},
  ),
  true,
)

const isolated = buildConsentItemsFromSummaries([
  {
    consentType: 'FACILITATOR_PLEDGE',
    agreed: false,
    status: 'WITHDRAWN',
    withdrawable: false,
  },
  {
    consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
    agreed: true,
    status: 'AGREED',
    withdrawable: true,
  },
])
assert.equal(isolated.documentItems.find(item => item.id === 'educatorPledge')?.agreed, false)
assert.equal(isolated.documentItems.find(item => item.id === 'sexOffenseCheck')?.agreed, true)
assert.equal(
  isolated.documentItems.find(item => item.id === 'sexOffenseCheck')?.withdrawable,
  true,
)

const draftNotAgreed = buildConsentItemsFromSummaries([
  {
    consentType: 'PAYMENT_STATEMENT_CONSENT',
    agreed: false,
    signed: false,
    status: 'DRAFT',
    withdrawable: false,
    documentId: 3,
  },
])
assert.equal(draftNotAgreed.documentItems[0]?.agreed, false)
assert.equal(canWithdrawConsent(draftNotAgreed.documentItems[0] ?? {}), false)

console.log('map-consents.selfcheck: ok')
