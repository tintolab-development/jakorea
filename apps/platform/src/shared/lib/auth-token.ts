/**
 * Platform 회원 auth 토큰 localStorage 헬퍼.
 * 로그인 연동 시 set/clear 호출. axios 인터셉터가 get을 사용한다.
 */

import { setAdminOnboardingRequired } from './admin-onboarding-session'
import { emitDevAuthChange } from './auth-session-event'
import { queryClient } from './query-client'

export const PLATFORM_AUTH_TOKEN_KEY = 'platform_auth_token'
export const PLATFORM_AUTH_REFRESH_TOKEN_KEY = 'platform_auth_refresh_token'
export const PLATFORM_AUTH_EXPIRES_AT_KEY = 'platform_auth_expires_at'

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
}

export function getExpiresAt(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(PLATFORM_AUTH_EXPIRES_AT_KEY)
}

export function setAuthTokens(input: {
  accessToken: string
  refreshToken?: string | null
  expiresAt?: string | null
}) {
  if (!canUseStorage()) return

  localStorage.setItem(PLATFORM_AUTH_TOKEN_KEY, input.accessToken)

  if (input.refreshToken) {
    localStorage.setItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY, input.refreshToken)
  }

  if (input.expiresAt) {
    localStorage.setItem(PLATFORM_AUTH_EXPIRES_AT_KEY, input.expiresAt)
  } else if (input.expiresAt === null) {
    localStorage.removeItem(PLATFORM_AUTH_EXPIRES_AT_KEY)
  }

  emitDevAuthChange(true)
}

/**
 * 토큰 제거. 기본으로 TanStack Query `['platform']` 캐시도 비운다.
 * logout / refresh 실패 시 호출.
 */
export function clearAuthTokens(options?: { clearQueryCache?: boolean }) {
  if (canUseStorage()) {
    localStorage.removeItem(PLATFORM_AUTH_TOKEN_KEY)
    localStorage.removeItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
    localStorage.removeItem(PLATFORM_AUTH_EXPIRES_AT_KEY)
  }

  setAdminOnboardingRequired(false)

  if (options?.clearQueryCache !== false) {
    queryClient.removeQueries({ queryKey: ['platform'] })
  }

  emitDevAuthChange(false)
}
