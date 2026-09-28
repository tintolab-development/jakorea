import { describe, expect, it } from 'vitest'

import { shouldSkipUnauthenticatedSocialConnectStart } from './register-social-connect-state'

describe('shouldSkipUnauthenticatedSocialConnectStart', () => {
  it('관리자 등록 회원 최초 로그인 소셜 연결은 핸드오프 토큰이 없어도 API를 호출한다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: false,
        hasSignupSocialLinkToken: false,
        firstLoginOnboarding: true,
      })
    ).toBe(false)
  })

  it('로그인 세션이 있으면 연결 시작을 막지 않는다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: true,
        hasSignupSocialLinkToken: false,
        firstLoginOnboarding: false,
      })
    ).toBe(false)
  })

  it('가입 직후 세션도 로그인 세션도 없으면 연결 시작을 막는다', () => {
    expect(
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled: true,
        hasAccessToken: false,
        hasSignupSocialLinkToken: false,
        firstLoginOnboarding: false,
      })
    ).toBe(true)
  })
})
