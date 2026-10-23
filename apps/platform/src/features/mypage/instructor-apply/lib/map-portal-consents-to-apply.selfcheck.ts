import assert from 'node:assert/strict'
import {
  buildInstructorApplyConsentPreviewFallbackItem,
  mapPortalConsentsToInstructorApplyPreviewItems,
  mapPortalConsentsToInstructorApplyValues,
} from './map-portal-consents-to-apply.ts'

const mapped = mapPortalConsentsToInstructorApplyValues([
  {
    consentType: 'PAYMENT_STATEMENT_PRE_CONSENT',
    agreed: true,
    signed: true,
    status: 'COMPLETED',
    agreedAt: '2026-10-23T21:07:36',
    documentId: 101,
  },
  {
    consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    agreed: true,
    signed: true,
    status: 'COMPLETED',
    agreedAt: '2026-10-23T21:06:38',
    documentId: 202,
  },
])

assert.equal(mapped.values.consentPaymentStatement, 'agree')
assert.equal(mapped.values.consentAdministrativeJoint, 'agree')
assert.equal(mapped.values.consentEducatorPledge, 'disagree')

const previewItems = mapPortalConsentsToInstructorApplyPreviewItems([
  {
    consentType: 'PAYMENT_STATEMENT_PRE_CONSENT',
    agreed: true,
    signed: true,
    status: 'COMPLETED',
    agreedAt: '2026-10-23T21:07:36',
    documentId: 101,
  },
  {
    consentType: 'ADMINISTRATIVE_INFO_CONSENT',
    agreed: true,
    signed: true,
    status: 'COMPLETED',
    agreedAt: '2026-10-23T21:06:38',
    documentId: 202,
  },
])

assert.equal(previewItems.consentPaymentStatement?.documentId, 101)
assert.equal(previewItems.consentPaymentStatement?.title, '지급조서 사전 동의서')
assert.equal(previewItems.consentAdministrativeJoint?.documentId, 202)
assert.equal(previewItems.consentEducatorPledge, undefined)

const fallback = buildInstructorApplyConsentPreviewFallbackItem(
  'consentPaymentStatement',
  '2026.10.23 21:07',
)
assert.equal(fallback.id, 'paymentStatement')
assert.equal(fallback.kind, 'document')
assert.equal(fallback.agreed, true)

console.log('map-portal-consents-to-apply.selfcheck: ok')
