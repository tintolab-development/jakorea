import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearSignupSocialLinkHandoff,
  getSignupSocialLinkToken,
  hasSignupSocialLinkHandoff,
  persistSignupSocialLinkHandoff,
} from './signup-social-link-handoff'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('signup-social-link-handoff', () => {
  beforeEach(() => {
    const sessionStorage = createMemoryStorage()
    vi.stubGlobal('sessionStorage', sessionStorage)
    vi.stubGlobal('window', { sessionStorage })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('가입 완료 토큰을 저장하고 읽는다', () => {
    persistSignupSocialLinkHandoff('handoff-token', '2099-01-01T00:00:00.000Z')
    expect(getSignupSocialLinkToken()).toBe('handoff-token')
    expect(hasSignupSocialLinkHandoff()).toBe(true)
  })

  it('빈 토큰이면 기존 핸드오프를 지운다', () => {
    persistSignupSocialLinkHandoff('handoff-token')
    persistSignupSocialLinkHandoff('  ')
    expect(getSignupSocialLinkToken()).toBeNull()
    expect(hasSignupSocialLinkHandoff()).toBe(false)
  })

  it('만료된 토큰은 읽고 즉시 제거한다', () => {
    persistSignupSocialLinkHandoff('stale-token', '2000-01-01T00:00:00.000Z')
    expect(getSignupSocialLinkToken()).toBeNull()
    expect(sessionStorage.getItem('cms_signup_social_link_token')).toBeNull()
  })

  it('clear 하면 토큰과 만료를 모두 제거한다', () => {
    persistSignupSocialLinkHandoff('handoff-token', '2099-01-01T00:00:00.000Z')
    clearSignupSocialLinkHandoff()
    expect(getSignupSocialLinkToken()).toBeNull()
  })
})
