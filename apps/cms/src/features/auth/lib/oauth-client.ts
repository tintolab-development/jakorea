import type { SocialProvider } from '@/entities/user/api/auth-service'

const OAUTH_STATE_PREFIX = 'oauth_state_'
const LOCAL_APP_ORIGIN = 'http://localhost:5173'

const PROVIDER_AUTHORIZE_ENDPOINT: Record<SocialProvider, string> = {
  kakao: 'https://kauth.kakao.com/oauth/authorize',
  naver: 'https://nid.naver.com/oauth2.0/authorize',
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
}

function getClientId(provider: SocialProvider): string {
  const envMap: Record<SocialProvider, string | undefined> = {
    kakao: import.meta.env.VITE_KAKAO_CLIENT_ID,
    naver: import.meta.env.VITE_NAVER_CLIENT_ID,
    google: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  }
  const clientId = envMap[provider]
  if (!clientId) {
    throw new Error(`${provider} OAuth 클라이언트 ID가 설정되지 않았습니다.`)
  }
  return clientId
}

export function getOAuthRedirectUri(provider: SocialProvider): string {
  return `${LOCAL_APP_ORIGIN}/oauth/${provider}`
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

export function createOAuthState(provider: SocialProvider): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const state = `${provider}:${Date.now()}:${random}`
  localStorage.setItem(`${OAUTH_STATE_PREFIX}${provider}`, state)
  return state
}

export function validateOAuthState(provider: SocialProvider, state: string | null): boolean {
  if (!state) {
    return false
  }
  const key = `${OAUTH_STATE_PREFIX}${provider}`
  const expected = localStorage.getItem(key)
  localStorage.removeItem(key)
  return Boolean(expected) && expected === state
}

export function buildOAuthAuthorizeUrl(provider: SocialProvider): string {
  const endpoint = PROVIDER_AUTHORIZE_ENDPOINT[provider]
  const clientId = getClientId(provider)
  const redirectUri = getOAuthRedirectUri(provider)
  const state = createOAuthState(provider)
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
