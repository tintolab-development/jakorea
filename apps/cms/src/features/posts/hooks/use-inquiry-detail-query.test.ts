import { describe, expect, it } from 'vitest'
import {
  INQUIRY_DETAIL_AUDIT_UNAVAILABLE_MESSAGE,
  INQUIRY_DETAIL_FORBIDDEN_MESSAGE,
  inquiryDetailPrivacyMessage,
  readInquiryDetailPrivacyFailure,
} from './use-inquiry-detail-query'

function axiosError(status: number, code?: string): unknown {
  return { response: { status, data: code ? { error: { code } } : {} } }
}

describe('inquiry detail privacy', () => {
  it('classifies masked-detail failures without treating every 503 as an audit failure', () => {
    expect(readInquiryDetailPrivacyFailure(axiosError(503, 'AUDIT_LOG_UNAVAILABLE'))).toBe(
      'audit-unavailable'
    )
    expect(inquiryDetailPrivacyMessage('audit-unavailable')).toBe(
      INQUIRY_DETAIL_AUDIT_UNAVAILABLE_MESSAGE
    )
    expect(readInquiryDetailPrivacyFailure(axiosError(403))).toBe('forbidden')
    expect(inquiryDetailPrivacyMessage('forbidden')).toBe(INQUIRY_DETAIL_FORBIDDEN_MESSAGE)
    expect(readInquiryDetailPrivacyFailure(axiosError(503, 'PROVIDER_UNAVAILABLE'))).toBeNull()
  })
})
