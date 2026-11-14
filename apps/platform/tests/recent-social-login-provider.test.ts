// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  RECENT_SOCIAL_LOGIN_PROVIDER_KEY,
  readRecentSocialLoginProvider,
  rememberRecentSocialLoginProvider,
  resolveSocialProviderParam,
} from '../src/features/auth/social-auth/recent-login-provider'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('최근 소셜 로그인 수단 저장', () => {
  it('provider 키만 저장하고 다시 읽는다', () => {
    rememberRecentSocialLoginProvider('naver')

    expect(localStorage.getItem(RECENT_SOCIAL_LOGIN_PROVIDER_KEY)).toBe('naver')
    expect(readRecentSocialLoginProvider()).toBe('naver')
  })

  it('알 수 없는 저장값은 무시한다', () => {
    localStorage.setItem(RECENT_SOCIAL_LOGIN_PROVIDER_KEY, 'someone@example.com')

    expect(readRecentSocialLoginProvider()).toBeNull()
  })

  it('저장소를 쓸 수 없어도 오류 없이 툴팁만 생략한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => rememberRecentSocialLoginProvider('kakao')).not.toThrow()
    expect(readRecentSocialLoginProvider()).toBeNull()
  })

  it('콜백 provider 값(소문자·API 코드)을 provider 키로 바꾸고 모르면 null', () => {
    expect(resolveSocialProviderParam('google')).toBe('google')
    expect(resolveSocialProviderParam('KAKAO')).toBe('kakao')
    expect(resolveSocialProviderParam('')).toBeNull()
    expect(resolveSocialProviderParam(null)).toBeNull()
    expect(resolveSocialProviderParam('apple')).toBeNull()
  })
})
