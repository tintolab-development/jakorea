import type { SocialProvider } from '@/entities/user/api/auth-service'

const CONNECTED_PROVIDERS_KEY = 'register_social_connected_providers'
const OAUTH_INTENT_KEY = 'oauth_intent'
const REGISTER_SOCIAL_REDIRECT_KEY = 'register_social_redirect'

export type OAuthIntent = 'login' | 'register-social-link'

function readConnectedProviders(): SocialProvider[] {
  try {
    const raw = sessionStorage.getItem(CONNECTED_PROVIDERS_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is SocialProvider =>
      item === 'google' || item === 'naver' || item === 'kakao'
    )
  } catch {
    return []
  }
}

function writeConnectedProviders(providers: SocialProvider[]) {
  sessionStorage.setItem(CONNECTED_PROVIDERS_KEY, JSON.stringify(providers))
}

export function getConnectedProviders(): Set<SocialProvider> {
  return new Set(readConnectedProviders())
}

export function addConnectedProvider(provider: SocialProvider) {
  const next = new Set(readConnectedProviders())
  next.add(provider)
  writeConnectedProviders([...next])
}

export function removeConnectedProvider(provider: SocialProvider) {
  const next = new Set(readConnectedProviders())
  next.delete(provider)
  writeConnectedProviders([...next])
}

export function setRegisterSocialLinkIntent(redirectPath?: string) {
  sessionStorage.setItem(OAUTH_INTENT_KEY, 'register-social-link')
  if (redirectPath) {
    sessionStorage.setItem(REGISTER_SOCIAL_REDIRECT_KEY, redirectPath)
  } else {
    sessionStorage.removeItem(REGISTER_SOCIAL_REDIRECT_KEY)
  }
}

export function getOAuthIntent(): OAuthIntent | null {
  const intent = sessionStorage.getItem(OAUTH_INTENT_KEY)
  if (intent === 'login' || intent === 'register-social-link') {
    return intent
  }
  return null
}

export function getRegisterSocialRedirect(): string | undefined {
  return sessionStorage.getItem(REGISTER_SOCIAL_REDIRECT_KEY) ?? undefined
}

export function clearOAuthIntent() {
  sessionStorage.removeItem(OAUTH_INTENT_KEY)
  sessionStorage.removeItem(REGISTER_SOCIAL_REDIRECT_KEY)
}

export function buildRegisterSocialConnectPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/social-connect'
  }
  return `/register/social-connect?redirect=${encodeURIComponent(redirectPath)}`
}

export function buildRegisterSocialConnectCompletePath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/social-connect/complete'
  }
  return `/register/social-connect/complete?redirect=${encodeURIComponent(redirectPath)}`
}

export function buildRegisterSocialConnectFailedPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/social-connect/failed'
  }
  return `/register/social-connect/failed?redirect=${encodeURIComponent(redirectPath)}`
}
