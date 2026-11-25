import { describe, expect, it } from 'vitest'
import { createPortalSsoAdapter } from '../../../packages/social-auth/src/adapters/portal-sso-adapter'
import { portalSocialAuthPaths } from '../src/features/auth/social-auth/paths'

const base = 'https://backend.example.test'
const canonical = 'https://jakorea.org'
const callback = (provider: string, intent: 'login' | 'link') =>
  intent === 'login'
    ? portalSocialAuthPaths.ssoProviderCallback(provider)
    : portalSocialAuthPaths.linkProviderCallback(provider)

describe('portal OAuth callback ownership', () => {
  for (const [provider, intent, expectedOrigin] of [
    ['naver', 'login', canonical],
    ['naver', 'link', base],
    ['google', 'login', base],
    ['kakao', 'login', base],
  ] as const) {
    it(`${provider} ${intent} uses ${expectedOrigin}`, async () => {
      const uri = new URL('https://provider.example.test/authorize')
      uri.searchParams.set('redirect_uri', canonical + callback(provider, intent))
      uri.searchParams.set('state', 'test-state')
      uri.searchParams.set('client_id', 'test-client')
      const authorizationUrl = uri.toString()
      const adapter = createPortalSsoAdapter({
        http: {
          post: async <T,>() => ({ data: { authorizationUrl, state: 'test-state' } as T }),
          get: async <T,>() => ({ data: null as T }),
          delete: async <T,>() => ({ data: null as T }),
        },
        paths: portalSocialAuthPaths,
        resolveBackendCallbackUri: (p, i) => base + callback(p, i),
      })
      const result = await adapter.startSso!({
        provider,
        intent,
        redirectUri: canonical + callback(provider, intent),
        frontendReturnUrl: canonical + '/auth/social/complete',
      })
      const actual = new URL(result.authorizationUrl)
      expect(actual.searchParams.get('redirect_uri')).toBe(expectedOrigin + callback(provider, intent))
      expect(actual.searchParams.get('state')).toBe('test-state')
      expect(actual.searchParams.get('client_id')).toBe('test-client')
      expect(result.state).toBe('test-state')
      if (provider === 'naver' && intent === 'login') {
        expect(result.authorizationUrl).toBe(authorizationUrl)
      }
    })
  }
})
