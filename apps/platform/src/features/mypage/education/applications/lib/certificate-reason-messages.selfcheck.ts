import assert from 'node:assert/strict'
import {
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE,
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  messageForPortalCertificateReasonCode,
} from './certificate-reason-messages.ts'

assert.equal(
  messageForPortalCertificateReasonCode(CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE),
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
)
assert.equal(
  messageForPortalCertificateReasonCode('certificate_consent_evidence_unavailable'),
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
)
assert.equal(messageForPortalCertificateReasonCode('OTHER'), null)
assert.equal(messageForPortalCertificateReasonCode(null), null)
assert.equal(
  messageForPortalCertificateReasonCode('ISSUANCE_PERIOD_EXPIRED'),
  '수료증 발급 기간이 만료되었습니다.'
)

console.log('certificate-reason-messages.selfcheck: ok')
