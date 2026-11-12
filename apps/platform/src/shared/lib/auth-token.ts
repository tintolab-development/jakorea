/**
 * Platform 회원 auth 토큰 localStorage 헬퍼.
 * 로그인 연동 시 set/clear 호출. axios 인터셉터가 get을 사용한다.
 */

import { resetPortraitConsentDraftDocumentSession } from '@/features/mypage/settings/lib/portrait-consent-draft-document-session'
import { setAdminOnboardingRequired } from './admin-onboarding-session'
import { emitDevAuthChange } from './auth-session-event'
import { queryClient } from './query-client'

export const PLATFORM_AUTH_TOKEN_KEY = 'platform_auth_token'
export const PLATFORM_AUTH_REFRESH_TOKEN_KEY = 'platform_auth_refresh_token'
export const PLATFORM_AUTH_EXPIRES_AT_KEY = 'platform_auth_expires_at'
/**
 * QA-0137: 본문 없이 HttpOnly 쿠키(`JA_MEMBER_RT`)로 refresh하는 세션 표시. 토큰 값은 저장하지 않는다.
 * 응답 본문에 refreshToken이 없을 때(운영 `JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false`)만 켜진다.
 */
export const PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY = 'platform_auth_refresh_cookie_session'

/**
 * 이 탭에서 토큰이 교체(로그인·소셜·비밀번호 변경·Refresh)되거나 제거될 때마다 증가한다.
 * 오래된 요청의 인증 실패가 새 세션을 지우지 못하도록 세대 비교에 쓴다. (다른 탭 교체는 저장값 비교로 판정)
 */
let authGeneration = 0

export function getAuthGeneration(): number {
  return authGeneration
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(PLATFORM_AUTH_TOKEN_KEY)
}

// TODO(QA-0137 인프라 전환 후 삭제): 운영 JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false·쿠키 refresh 검증 후
// localStorage refreshToken 저장·조회(getRefreshToken·setAuthTokens의 refreshToken 분기)를 지우고 쿠키로만 refresh한다.
export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
}

/** refresh를 시도할 수단이 있는지 (저장된 refreshToken 또는 HttpOnly 쿠키 세션 표시) */
export function hasRefreshCredential(): boolean {
  if (!canUseStorage()) return false
  return (
    Boolean(localStorage.getItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)) ||
    localStorage.getItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY) === '1'
  )
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

  authGeneration += 1
  localStorage.setItem(PLATFORM_AUTH_TOKEN_KEY, input.accessToken)

  if (input.refreshToken) {
    // TODO(QA-0137 인프라 전환 후 삭제): 본문 refreshToken 저장 분기.
    localStorage.setItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY, input.refreshToken)
    localStorage.removeItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)
  } else {
    // QA-0137: 응답 본문에 refreshToken이 없으면 이전 저장값은 서버가 이미 rotate한 토큰이다.
    // 서버는 본문을 쿠키보다 먼저 쓰므로 다시 보내면 재사용 탐지(세션 폐기)에 걸린다 → 지우고 쿠키 세션으로 표시.
    localStorage.removeItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
    localStorage.setItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY, '1')
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
 * 공개 홈(`home`)과 사이트 셸(`site`)은 비로그인이라 유지한다.
 */
export function clearAuthTokens(options?: { clearQueryCache?: boolean }) {
  authGeneration += 1
  if (canUseStorage()) {
    localStorage.removeItem(PLATFORM_AUTH_TOKEN_KEY)
    localStorage.removeItem(PLATFORM_AUTH_REFRESH_TOKEN_KEY)
    localStorage.removeItem(PLATFORM_AUTH_REFRESH_COOKIE_SESSION_KEY)
    localStorage.removeItem(PLATFORM_AUTH_EXPIRES_AT_KEY)
  }

  setAdminOnboardingRequired(false)
  resetPortraitConsentDraftDocumentSession()

  if (options?.clearQueryCache !== false) {
    queryClient.removeQueries({
      queryKey: ['platform'],
      predicate: query => query.queryKey[1] !== 'home' && query.queryKey[1] !== 'site',
    })
  }

  emitDevAuthChange(false)
}
