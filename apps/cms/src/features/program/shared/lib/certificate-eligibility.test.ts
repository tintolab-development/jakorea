import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_CERTIFIED_PERIOD_MISSING_MESSAGE,
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE,
  CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE_MESSAGE,
  CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE,
  ISSUANCE_PERIOD_EXPIRED,
  ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  PARTICIPANT_NOT_COMPLETED,
  PARTICIPANT_NOT_COMPLETED_MESSAGE,
  certificateBlockingReasons,
  certificateIssuePrecheckBlockMessage,
  isCertificateEligibleForIssue,
  messageForCertificateReasonCode,
  certificateCertifiedPeriodIssueBlockMessage,
  hasUsableCertificateCertifiedPeriod,
  readCertificateCertifiedPeriod,
  selectIssuableCertificatePlan,
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

  it('ignores SATISFACTION_SURVEY_NOT_COMPLETED as a completion block', () => {
    expect(
      isCertificateEligibleForIssue({
        eligible: true,
        blockingReasons: ['SATISFACTION_SURVEY_NOT_COMPLETED'],
      })
    ).toBe(true)
    expect(
      certificateBlockingReasons({
        eligible: true,
        blockingReasons: ['SATISFACTION_SURVEY_NOT_COMPLETED', PARTICIPANT_NOT_COMPLETED],
      })
    ).toEqual([PARTICIPANT_NOT_COMPLETED])
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
    expect(messageForCertificateReasonCode('NO_RECOGNIZED_RECORD')).toBe(
      CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE
    )
  })
})

describe('selectIssuableCertificatePlan', () => {
  const eligible = { eligible: true, blockingReasons: [] as string[] }
  const ineligible = {
    eligible: false,
    reasonCode: PARTICIPANT_NOT_COMPLETED,
    blockingReasons: [PARTICIPANT_NOT_COMPLETED],
  }
  const noRecord = {
    eligible: false,
    reasonCode: 'NO_RECOGNIZED_RECORD',
    blockingReasons: ['NO_RECOGNIZED_RECORD'],
  }

  it('GIVE_UP uses PARTICIPATION only and never COMPLETION', () => {
    const plan = selectIssuableCertificatePlan({
      activityWithdrawn: true,
      completion: eligible,
      participation: eligible,
    })
    expect(plan.apiType).toBe('PARTICIPATION')
    expect(plan.eligible).toBe(true)
  })

  it('GIVE_UP with no recognized record is not issuable', () => {
    const plan = selectIssuableCertificatePlan({
      activityWithdrawn: true,
      completion: ineligible,
      participation: noRecord,
    })
    expect(plan.apiType).toBe('PARTICIPATION')
    expect(plan.eligible).toBe(false)
    expect(plan.blockMessage).toBe(CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE)
  })

  it('keeps COMPLETION when the participant is eligible to complete', () => {
    const plan = selectIssuableCertificatePlan({
      activityWithdrawn: false,
      completion: eligible,
      participation: eligible,
    })
    expect(plan.apiType).toBe('COMPLETION')
    expect(plan.eligible).toBe(true)
  })
})

describe('readCertificateCertifiedPeriod', () => {
  it('reads official BE period fields and ignores unofficial aliases', () => {
    expect(
      readCertificateCertifiedPeriod({
        certificatePeriodStartDate: '2026-03-01',
        certificatePeriodEndDate: '2026-04-10',
        certificatePeriodLabel: '2026.03.01 ~ 2026.04.10',
        countedParticipationCount: 2,
      })
    ).toEqual({
      start: '2026-03-01',
      end: '2026-04-10',
      label: '2026.03.01 ~ 2026.04.10',
      countedParticipationCount: 2,
    })
    expect(
      readCertificateCertifiedPeriod({
        participationStartDate: '2026-03-01',
        participationEndDate: '2026-04-10',
        certifiedStartDate: '2026-03-01',
        certifiedEndDate: '2026-04-10',
      })
    ).toBeNull()
    expect(
      readCertificateCertifiedPeriod({
        certificatePeriodStartDate: null,
        certificatePeriodEndDate: null,
        certificatePeriodLabel: null,
        countedParticipationCount: null,
      })
    ).toBeNull()
    expect(readCertificateCertifiedPeriod({ eligible: true })).toBeNull()
  })
})

describe('certificateCertifiedPeriodIssueBlockMessage', () => {
  const recognized = {
    start: '2026-03-01',
    end: '2026-04-10',
    label: '2026.03.01 ~ 2026.04.10',
    countedParticipationCount: 2,
  }

  it('keeps normal completion on the existing program-period fallback', () => {
    expect(
      certificateCertifiedPeriodIssueBlockMessage({
        activityWithdrawn: false,
        period: null,
      })
    ).toBeNull()
    expect(hasUsableCertificateCertifiedPeriod(null)).toBe(false)
  })

  it('allows GIVE_UP when the server certified period is present', () => {
    expect(
      certificateCertifiedPeriodIssueBlockMessage({
        activityWithdrawn: true,
        period: recognized,
      })
    ).toBeNull()
    expect(hasUsableCertificateCertifiedPeriod(recognized)).toBe(true)
  })

  it('blocks GIVE_UP with 0 counted records without filling the program period', () => {
    expect(
      certificateCertifiedPeriodIssueBlockMessage({
        activityWithdrawn: true,
        period: {
          start: null,
          end: null,
          label: null,
          countedParticipationCount: 0,
        },
      })
    ).toBe(CERTIFICATE_NO_RECOGNIZED_RECORD_MESSAGE)
  })

  it('blocks GIVE_UP when certified period fields are missing', () => {
    expect(
      certificateCertifiedPeriodIssueBlockMessage({
        activityWithdrawn: true,
        period: null,
      })
    ).toBe(CERTIFICATE_CERTIFIED_PERIOD_MISSING_MESSAGE)
  })
})
