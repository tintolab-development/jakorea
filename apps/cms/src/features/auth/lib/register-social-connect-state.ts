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

const SOCIAL_CONNECT_AUTH_FLOW_PREFIXES = [
  '/register',
  '/login',
  '/social-connect',
  '/oauth/',
  '/auth/password-change-required',
] as const

/** 비밀번호 변경 완료 → 소셜 연결 진입 시 `?flow=` 값 */
export const SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED = 'password-change-required' as const

export function isPasswordChangeRequiredSocialConnectFlow(flow?: string): boolean {
  return flow === SOCIAL_CONNECT_FLOW_PASSWORD_CHANGE_REQUIRED
}

/** 소셜 연결 완료·스킵 시 돌아가면 안 되는 인증/가입 플로우 경로 */
export function isSocialConnectAuthFlowPath(path?: string): boolean {
  if (!path?.trim()) {
    return true
  }

  const pathname = path.trim().split('?')[0]?.replace(/\/+$/, '') || ''
  if (!pathname.startsWith('/')) {
    return true
  }

  return SOCIAL_CONNECT_AUTH_FLOW_PREFIXES.some(
    prefix => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix)
  )
}

export function normalizeSocialConnectRedirectPath(
  redirectPath: string | undefined,
  fallbackPath: string
): string | undefined {
  if (!redirectPath?.startsWith('/') || isSocialConnectAuthFlowPath(redirectPath)) {
    return fallbackPath
  }
  return redirectPath
}

export function resolveSocialConnectFinishPath(options: {
  isAuthenticated: boolean
  redirectPath?: string
  fallbackPath: string
}): string {
  const { isAuthenticated, redirectPath, fallbackPath } = options

  if (!isAuthenticated) {
    const safeRedirect = normalizeSocialConnectRedirectPath(redirectPath, fallbackPath)
    if (safeRedirect && safeRedirect !== fallbackPath) {
      return `/login?redirect=${encodeURIComponent(safeRedirect)}`
    }
    return '/login'
  }

  return normalizeSocialConnectRedirectPath(redirectPath, fallbackPath) ?? fallbackPath
}

export function buildRegisterSocialConnectPath(
  redirectPath?: string,
  options?: { flow?: string }
) {
  const params = new URLSearchParams()
  if (redirectPath) {
    params.set('redirect', redirectPath)
  }
  if (options?.flow) {
    params.set('flow', options.flow)
  }
  const query = params.toString()
  return query ? `/register/social-connect?${query}` : '/register/social-connect'
}

export function buildRegisterCompletePath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/complete'
  }
  return `/register/complete?redirect=${encodeURIComponent(redirectPath)}`
}

export function buildRegisterSocialConnectCompletePath(
  redirectPath?: string,
  options?: { flow?: string }
) {
  const params = new URLSearchParams()
  if (redirectPath) {
    params.set('redirect', redirectPath)
  }
  if (options?.flow) {
    params.set('flow', options.flow)
  }
  const query = params.toString()
  return query ? `/register/social-connect/complete?${query}` : '/register/social-connect/complete'
}

/** 로그인 후 소셜 연결 완료 (내 정보 수정 등) */
export function buildSocialConnectCompletePath(redirectPath?: string) {
  if (!redirectPath) {
    return '/social-connect/complete'
  }
  return `/social-connect/complete?redirect=${encodeURIComponent(redirectPath)}`
}

export function buildRegisterSocialConnectFailedPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/register/social-connect/failed'
  }
  return `/register/social-connect/failed?redirect=${encodeURIComponent(redirectPath)}`
}
