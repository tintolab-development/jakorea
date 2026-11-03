import { describe, expect, it } from 'vitest'
import {
  RECIPIENT_CANDIDATE_AUDIT_UNAVAILABLE_MESSAGE,
  RECIPIENT_CANDIDATE_FORBIDDEN_MESSAGE,
  readRecipientCandidatePrivacyFailure,
  recipientCandidateErrorNotice,
} from './recipient-candidate-privacy'

function axiosError(status: number, code?: string): unknown {
  return { response: { status, data: code ? { error: { code, message: code } } : {} } }
}

describe('recipient candidate privacy', () => {
  it('classifies audit failure and forbidden separately from other errors', () => {
    expect(readRecipientCandidatePrivacyFailure(axiosError(503, 'AUDIT_LOG_UNAVAILABLE'))).toBe(
      'audit-unavailable'
    )
    expect(readRecipientCandidatePrivacyFailure(axiosError(403))).toBe('forbidden')
    expect(readRecipientCandidatePrivacyFailure(axiosError(503, 'PROVIDER_UNAVAILABLE'))).toBeNull()
  })

  it('uses the audit copy and does not fall back to a provider outage message', () => {
    expect(recipientCandidateErrorNotice(axiosError(503, 'AUDIT_LOG_UNAVAILABLE'))).toBe(
      RECIPIENT_CANDIDATE_AUDIT_UNAVAILABLE_MESSAGE
    )
    expect(recipientCandidateErrorNotice(axiosError(403))).toBe(RECIPIENT_CANDIDATE_FORBIDDEN_MESSAGE)
  })
})
