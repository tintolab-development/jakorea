import { describe, expect, it } from 'vitest'
import {
  MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON,
  memberConsentViewRequiresPrivacyReveal,
} from './member-consent-view-privacy'

describe('memberConsentViewRequiresPrivacyReveal', () => {
  it('지급조서·행정정보·성범죄는 열람 사유 모달 필요', () => {
    expect(memberConsentViewRequiresPrivacyReveal('agreement-third-party')).toBe(true)
    expect(memberConsentViewRequiresPrivacyReveal('document-payment-order-pre-consent')).toBe(true)
    expect(memberConsentViewRequiresPrivacyReveal('agreement-notice')).toBe(true)
    expect(memberConsentViewRequiresPrivacyReveal('agreement-crime')).toBe(true)
  })

  it('초상권·교육진행자는 열람 사유 모달 불필요', () => {
    expect(memberConsentViewRequiresPrivacyReveal('agreement-portrait')).toBe(false)
    expect(memberConsentViewRequiresPrivacyReveal('agreement-expense')).toBe(false)
  })

  it('빈 templateId는 false', () => {
    expect(memberConsentViewRequiresPrivacyReveal('')).toBe(false)
    expect(memberConsentViewRequiresPrivacyReveal('  ')).toBe(false)
  })
})

describe('MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON', () => {
  it('고정 사유 문구', () => {
    expect(MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON).toBe('동의서 보기')
  })
})
