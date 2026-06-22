import type { OAuthClientConfig, SocialProvider } from './types'

const PROVIDER_AUTHORIZE_ENDPOINT: Record<SocialProvider, string> = {
  kakao: 'https://kauth.kakao.com/oauth/authorize',
  naver: 'https://nid.naver.com/oauth2.0/authorize',
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
}

function resolveOrigin(config: OAuthClientConfig): string {
  if (config.resolveOrigin) {
    return config.resolveOrigin()
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:3000'
}

export function getOAuthRedirectUri(
  config: OAuthClientConfig,
  callbackPath: string,
  provider: SocialProvider
): string {
  const path = callbackPath.replace('{provider}', provider)
  return `${resolveOrigin(config)}${path}`
}

function getClientId(config: OAuthClientConfig, provider: SocialProvider): string {
  const clientId = config.clientIds[provider]
  if (!clientId) {
    throw new Error(`${provider} OAuth 클라이언트 ID가 설정되지 않았습니다.`)
  }
  return clientId
}

function getProviderScope(provider: SocialProvider): string {
  switch (provider) {
    case 'google':
      return 'openid email profile'
    case 'kakao':
      return 'profile_nickname account_email'
    case 'naver':
      return 'name email'
    default:
      return ''
  }
}

export function buildOAuthAuthorizeUrl(
  config: OAuthClientConfig,
  callbackPath: string,
  provider: SocialProvider,
  state: string
): string {
  const endpoint = PROVIDER_AUTHORIZE_ENDPOINT[provider]
  const clientId = getClientId(config, provider)
  const redirectUri = getOAuthRedirectUri(config, callbackPath, provider)
  const scope = getProviderScope(provider)

  const params = new URLSearchParams()
  params.set('client_id', clientId)
  params.set('redirect_uri', redirectUri)
  params.set('response_type', 'code')
  params.set('state', state)
  if (scope) {
    params.set('scope', scope)
  }
  if (provider === 'naver') {
    params.set('auth_type', 'reprompt')
  }

  return `${endpoint}?${params.toString()}`
}
