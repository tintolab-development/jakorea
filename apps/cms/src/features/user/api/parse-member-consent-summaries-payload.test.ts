import { describe, expect, it } from 'vitest'
import { parseMemberConsentSummariesPayload } from './parse-member-consent-summaries-payload'

describe('parseMemberConsentSummariesPayload', () => {
  it('배열 본문을 그대로 반환한다', () => {
    const body = [{ consentType: 'SERVICE_TERMS', agreed: true }]
    expect(parseMemberConsentSummariesPayload(body)).toEqual(body)
  })

  it('Envelope data 배열이면 언랩한다', () => {
    const rows = [{ consentType: 'MARKETING', agreed: false }]
    expect(
      parseMemberConsentSummariesPayload({ success: true, data: rows })
    ).toEqual(rows)
  })

  it('배열이 아니면 빈 목록이다', () => {
    expect(parseMemberConsentSummariesPayload(undefined)).toEqual([])
    expect(parseMemberConsentSummariesPayload({ data: undefined })).toEqual([])
  })
})
