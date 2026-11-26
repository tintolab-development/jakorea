import { describe, expect, it } from 'vitest'
import { createPortalSsoAdapter } from '../../../packages/social-auth/src/adapters/portal-sso-adapter'
import { portalSocialAuthPaths } from '../src/features/auth/social-auth/paths'

const production = 'https://d2yfe3hmramof9.cloudfront.net'
const qa = 'https://d3r1iaa0sy4tcq.cloudfront.net'
const local = 'http://localhost:8080'
const canonical = 'https://jakorea.org'
const naverAuthorize = 'https://nid.naver.com/oauth2.0/authorize'
const callback = (provider: string, intent: 'login' | 'link') =>
  intent === 'login'
    ? portalSocialAuthPaths.ssoProviderCallback(provider)
    : portalSocialAuthPaths.linkProviderCallback(provider)

describe('portal OAuth callback ownership', () => {
  const cases = [
    ['newprod override', 'naver', 'login', production, canonical, naverAuthorize, canonical],
    ['newprod existing callback', 'naver', 'login', production, production, naverAuthorize, production],
    ['QA existing callback', 'naver', 'login', qa, qa, naverAuthorize, qa],
    ['QA cannot use production override', 'naver', 'login', qa, canonical, naverAuthorize, qa],
    ['QA localhost correction', 'naver', 'login', qa, local, naverAuthorize, qa],
    ['local cannot use production override', 'naver', 'login', local, canonical, naverAuthorize, local],
    ['unapproved callback host', 'naver', 'login', production, 'https://unapproved.example.test', naverAuthorize, production],
    ['unapproved callback alias', 'naver', 'login', production, 'https://www.jakorea.org', naverAuthorize, production],
    ['unapproved authorization origin', 'naver', 'login', production, canonical, 'https://unapproved.example.test/authorize', production],
    ['naver link unchanged', 'naver', 'link', production, canonical, naverAuthorize, production],
    ['google login unchanged', 'google', 'login', production, canonical, 'https://accounts.google.com/o/oauth2/v2/auth', production],
    ['kakao login unchanged', 'kakao', 'login', production, canonical, 'https://kauth.kakao.com/oauth/authorize', production],
  ] as const

  for (const [label, provider, intent, backendOrigin, returnedOrigin, authorizeEndpoint, expectedOrigin] of cases) {
    it(label, async () => {
      const uri = new URL(authorizeEndpoint)
      uri.searchParams.set('redirect_uri', returnedOrigin + callback(provider, intent))
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
        resolveBackendCallbackUri: (p, i) => backendOrigin + callback(p, i),
      })
      const result = await adapter.startSso!({
        provider,
        intent,
        redirectUri: backendOrigin + callback(provider, intent),
        frontendReturnUrl: backendOrigin + '/auth/social/complete',
      })
      const actual = new URL(result.authorizationUrl)
      expect(actual.searchParams.get('redirect_uri')).toBe(expectedOrigin + callback(provider, intent))
      expect(actual.searchParams.get('state')).toBe('test-state')
      expect(actual.searchParams.get('client_id')).toBe('test-client')
      expect(result.state).toBe('test-state')
      if (expectedOrigin === returnedOrigin) expect(result.authorizationUrl).toBe(authorizationUrl)
    })
  }
})
