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
  '신청일로부터 3년이 지나 발급할 수 없습니다.'
)
assert.equal(
  messageForPortalCertificateReasonCode('MEMBER_PARTICIPATION_CERTIFICATE_SELF_ISSUE_NOT_ALLOWED'),
  '참가인증서는 CMS 관리자만 발급할 수 있습니다.'
)
assert.equal(
  messageForPortalCertificateReasonCode('CERTIFICATE_APPLICATION_DATE_UNAVAILABLE'),
  '신청일을 확인할 수 없습니다.'
)

assert.equal(
  messageForPortalCertificateReasonCode('CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE'),
  '이름 또는 프로그램명이 없어 수료증을 만들 수 없습니다.',
)
assert.equal(
  messageForPortalCertificateReasonCode('COMPLETION_CERTIFICATE_REQUIRED'),
  '수료 조건을 충족한 뒤에는 수료증을 발급해 주세요.',
)
assert.equal(
  messageForPortalCertificateReasonCode('ATTENDANCE_NOT_COMPLETED'),
  '수료 조건을 충족하지 않아 발급할 수 없습니다.',
)
assert.equal(
  messageForPortalCertificateReasonCode('PARTICIPATION_NOT_STARTED'),
  '참가 이력이 없어 증명서를 발급할 수 없습니다.',
)
assert.equal(
  messageForPortalCertificateReasonCode('PARTICIPANT_NOT_COMPLETED'),
  '수료 조건을 충족하지 않아 발급할 수 없습니다.',
)

console.log('certificate-reason-messages.selfcheck: ok')
