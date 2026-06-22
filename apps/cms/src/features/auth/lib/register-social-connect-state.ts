import type { OAuthIntent, SocialProvider } from '@jakorea/social-auth'

import { cmsSocialAuthState } from '@/features/auth/social-auth/cms-client'

export type { OAuthIntent, SocialProvider }

export function getConnectedProviders() {
  return cmsSocialAuthState.getConnectedProviders()
}

export function addConnectedProvider(provider: SocialProvider) {
  cmsSocialAuthState.addConnectedProvider(provider)
}

export function removeConnectedProvider(provider: SocialProvider) {
  cmsSocialAuthState.removeConnectedProvider(provider)
}

export function setRegisterSocialLinkIntent(redirectPath?: string) {
  cmsSocialAuthState.setOAuthIntent('link', redirectPath)
}

export function getOAuthIntent() {
  return cmsSocialAuthState.getOAuthIntent()
}

export function getRegisterSocialRedirect(): string | undefined {
  return cmsSocialAuthState.getReturnUrl()
}

export function clearOAuthIntent() {
  cmsSocialAuthState.clearOAuthIntent()
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
