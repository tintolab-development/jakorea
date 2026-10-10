import { describe, expect, it } from 'vitest'

import { shouldSkipUnauthenticatedSocialConnectStart } from './register-social-connect-state'

describe('shouldSkipUnauthenticatedSocialConnectStart', () => {
  it('로그인 세션이 있으면 연결 시작을 막지 않는다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: true,
        hasSignupSocialLinkToken: false,
      })
    ).toBe(false)
  })

  it('가입 handoff 토큰이 있으면 연결 시작을 막지 않는다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: false,
        hasSignupSocialLinkToken: true,
      })
    ).toBe(false)
  })

  it('가입 직후 세션도 로그인 세션도 없으면 연결 시작을 막는다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: false,
        hasSignupSocialLinkToken: false,
      })
    ).toBe(true)
  })
})
