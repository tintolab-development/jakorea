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
assert.equal(adultById.portrait?.consentStatus, 'PARTIAL')
assert.equal(adultById.portrait?.agreed, true)
assert.equal(adultById.paymentStatement?.agreed, true)
assert.equal(adultById.paymentStatement?.withdrawable, true)
assert.equal(adult.documentItems.some(item => item.id === 'receiptPreConsent'), false)
/** 필드 누락(구버전 응답)은 null로 정규화 */
assert.equal(adultById.portrait?.allItemsAgreed, null)
assert.equal(adultById.serviceTerms?.allItemsAgreed, null)

const portraitAllItems = buildConsentItemsFromSummaries([
  { consentType: 'MARKETING', agreed: true, allItemsAgreed: null },
  {
    consentType: 'PORTRAIT_RIGHTS',
    agreed: true,
    consentStatus: 'PARTIAL',
    programEligible: true,
    allItemsAgreed: true,
  },
])
assert.equal(portraitAllItems.basicItems.find(item => item.id === 'portrait')?.allItemsAgreed, true)
assert.equal(portraitAllItems.basicItems.find(item => item.id === 'marketing')?.allItemsAgreed, null)
const portraitPartialItems = buildConsentItemsFromSummaries([
  { consentType: 'PORTRAIT_RIGHTS', agreed: true, consentStatus: 'PARTIAL', allItemsAgreed: false },
])
assert.equal(portraitPartialItems.basicItems[0]?.allItemsAgreed, false)

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
assert.equal(expired.basicItems[0]?.hint, '프로그램을 신청하시려면 다시 동의해 주세요.')

/** 만료 안내 — 동의서별 기획 문구, 행정정보는 문구 없음, 목록 외 항목은 공통 문구 */
const expiredDocuments = buildConsentItemsFromSummaries([
  { consentType: 'FACILITATOR_PLEDGE', agreed: true, expired: true },
  { consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT', agreed: true, expired: true },
  { consentType: 'PAYMENT_STATEMENT_CONSENT', agreed: true, expired: true },
  { consentType: 'RECEIPT_PRE_CONSENT', agreed: true, expired: true },
  { consentType: 'ADMINISTRATIVE_INFO_CONSENT', agreed: true, expired: true },
  { consentType: 'SERVICE_TERMS', agreed: true, reconsentRequired: true },
])
const expiredHintById = Object.fromEntries(
  [...expiredDocuments.basicItems, ...expiredDocuments.documentItems].map(item => [item.id, item.hint]),
)
assert.equal(expiredHintById.educatorPledge, '교육진행자 활동을 위해 다시 작성해 주세요.')
assert.equal(expiredHintById.sexOffenseCheck, '교육진행자 활동을 위해 다시 동의해 주세요.')
assert.equal(expiredHintById.paymentStatement, '정산을 신청하시려면 다시 동의해 주세요.')
assert.equal(expiredHintById.receiptPreConsent, '정산을 신청하시려면 다시 동의해 주세요.')
assert.equal(expiredHintById.administrativeJoint, undefined)
assert.equal(expiredHintById.serviceTerms, '유효기간이 만료되어 재동의가 필요해요.')

/** 「동의 만료」 — 기간제 6종만. 만료 없는 항목은 서버 expired를 무시 */
assert.equal(expired.basicItems[0]?.expired, true)
const expiredFlagById = Object.fromEntries(
  [...expiredDocuments.basicItems, ...expiredDocuments.documentItems].map(item => [item.id, item.expired]),
)
for (const id of ['educatorPledge', 'sexOffenseCheck', 'paymentStatement', 'receiptPreConsent', 'administrativeJoint']) {
  assert.equal(expiredFlagById[id], true, `${id} expired`)
}
/** reconsentRequired만 있는 항목은 「동의 만료」가 아니다 (약관 개정 재동의 표시는 미정) */
assert.equal(expiredFlagById.serviceTerms, false)

const nonFixedTermExpired = buildConsentItemsFromSummaries([
  { consentType: 'SERVICE_TERMS', required: true, agreed: true, expired: true, agreedAt: '2026-09-01T10:00:00' },
  { consentType: 'MARKETING', agreed: true, expired: true },
])
const nonFixedTermById = Object.fromEntries(nonFixedTermExpired.basicItems.map(item => [item.id, item]))
assert.equal(nonFixedTermById.serviceTerms?.expired, false)
assert.equal(nonFixedTermById.serviceTerms?.agreed, true)
assert.equal(nonFixedTermById.serviceTerms?.hint, undefined)
assert.equal(nonFixedTermById.marketing?.expired, false)
assert.equal(nonFixedTermById.marketing?.agreed, true)

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

const preferSubmittedPayment = buildConsentItemsFromSummaries([
  {
    consentType: 'PAYMENT_STATEMENT_PRE_CONSENT',
    agreed: false,
    signed: false,
    status: 'DRAFT',
    documentId: null,
  },
  {
    consentType: 'PAYMENT_STATEMENT_CONSENT',
    agreed: true,
    signed: true,
    documentId: 88,
  },
])
assert.equal(
  preferSubmittedPayment.documentItems.find(item => item.id === 'paymentStatement')?.documentId,
  88,
)
assert.equal(
  preferSubmittedPayment.documentItems.find(item => item.id === 'paymentStatement')?.agreed,
  true,
)
assert.equal(
  preferSubmittedPayment.documentItems.find(item => item.id === 'paymentStatement')?.signed,
  true,
)

const stringDocumentId = buildConsentItemsFromSummaries([
  {
    consentType: 'PAYMENT_STATEMENT_CONSENT',
    agreed: true,
    signed: true,
    documentId: '91' as unknown as number,
  },
])
assert.equal(
  stringDocumentId.documentItems.find(item => item.id === 'paymentStatement')?.documentId,
  91,
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
