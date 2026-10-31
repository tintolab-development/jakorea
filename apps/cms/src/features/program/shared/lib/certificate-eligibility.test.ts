import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE,
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  ISSUANCE_PERIOD_EXPIRED,
  ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  PARTICIPANT_NOT_COMPLETED,
  PARTICIPANT_NOT_COMPLETED_MESSAGE,
  certificateBlockingReasons,
  certificateIssuePrecheckBlockMessage,
  isCertificateEligibleForIssue,
  messageForCertificateReasonCode,
} from './certificate-eligibility'

describe('isCertificateEligibleForIssue', () => {
  it('treats eligible true + empty blockingReasons + policyId null as issuable', () => {
    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        policyId: null,
        blockingReasons: [],
        reasonCode: null,
      })
    ).toBe(true)

    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        blockingReasons: [],
      })
    ).toBe(true)
  })

  it('does not treat null blockingReasons as a filled list', () => {
    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        blockingReasons: null,
        reasonCode: null,
      })
    ).toBe(true)
    expect(certificateBlockingReasons({ eligible: true, blockingReasons: null })).toEqual([])
  })

  it('rejects missing eligible or blocking reasons', () => {
    expect(isCertificateEligibleForIssue(undefined)).toBe(false)
    expect(isCertificateEligibleForIssue({ eligible: false, policyId: 1 })).toBe(false)
    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        policyId: 91001,
        blockingReasons: [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE],
      })
    ).toBe(false)
  })

  it('keeps eligible true when reasonCode is set but blockingReasons is empty', () => {
    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        policyId: null,
        blockingReasons: [],
        reasonCode: CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE,
      })
    ).toBe(true)
  })
})

describe('certificateIssuePrecheckBlockMessage', () => {
  it('blocks consent evidence unavailable from blockingReasons even if eligible is true', () => {
    expect(
      certificateIssuePrecheckBlockMessage({
        eligible: true,
        blockingReasons: [CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE],
      })
    ).toBe(CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE)
  })

  it('does not precheck-block eligible true with empty blockingReasons', () => {
    expect(
      certificateIssuePrecheckBlockMessage({
        eligible: true,
        reasonCode: null,
        blockingReasons: [],
      })
    ).toBeNull()
  })

  it('blocks issuance period expired from reasonCode', () => {
    expect(
      certificateIssuePrecheckBlockMessage({
        eligible: false,
        reasonCode: ISSUANCE_PERIOD_EXPIRED,
        blockingReasons: [],
      })
    ).toBe(ISSUANCE_PERIOD_EXPIRED_MESSAGE)
  })

  it('does not precheck-block PARTICIPANT_NOT_COMPLETED alone', () => {
    expect(
      certificateIssuePrecheckBlockMessage({
        eligible: false,
        reasonCode: PARTICIPANT_NOT_COMPLETED,
        blockingReasons: [PARTICIPANT_NOT_COMPLETED],
      })
    ).toBeNull()
  })
})

describe('messageForCertificateReasonCode', () => {
  it('maps consent evidence unavailable to server copy', () => {
    expect(messageForCertificateReasonCode(CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE)).toBe(
      CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
    )
    expect(messageForCertificateReasonCode('certificate_consent_evidence_unavailable')).toBe(
      CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE
    )
    expect(messageForCertificateReasonCode(ISSUANCE_PERIOD_EXPIRED)).toBe(
      ISSUANCE_PERIOD_EXPIRED_MESSAGE
    )
    expect(messageForCertificateReasonCode(PARTICIPANT_NOT_COMPLETED)).toBe(
      PARTICIPANT_NOT_COMPLETED_MESSAGE
    )
    expect(messageForCertificateReasonCode('OTHER')).toBeNull()
  })
})
