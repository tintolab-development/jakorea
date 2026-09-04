/**
 * 가입 직후 소셜 연결 public handoff.
 * `POST /api/admin/auth/signup/complete` 응답의 signupSocialLinkToken을
 * 같은 탭 세션에만 보관한다. 토큰 값은 로그에 남기지 않는다.
 */

const TOKEN_KEY = 'cms_signup_social_link_token'
const EXPIRES_KEY = 'cms_signup_social_link_expires_at'

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage)
}

export function persistSignupSocialLinkHandoff(
  token?: string | null,
  expiresAt?: string | null
): void {
  if (!canUseSessionStorage()) {
    return
  }

  const trimmed = token?.trim()
  if (!trimmed) {
    clearSignupSocialLinkHandoff()
    return
  }

  sessionStorage.setItem(TOKEN_KEY, trimmed)
  if (expiresAt?.trim()) {
    sessionStorage.setItem(EXPIRES_KEY, expiresAt.trim())
  } else {
    sessionStorage.removeItem(EXPIRES_KEY)
  }
}

export function clearSignupSocialLinkHandoff(): void {
  if (!canUseSessionStorage()) {
    return
  }

  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_KEY)
}

export function getSignupSocialLinkToken(): string | null {
  if (!canUseSessionStorage()) {
    return null
  }

  const token = sessionStorage.getItem(TOKEN_KEY)?.trim()
  if (!token) {
    return null
  }

  const expiresAt = sessionStorage.getItem(EXPIRES_KEY)?.trim()
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt)
    if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) {
      clearSignupSocialLinkHandoff()
      return null
    }
  }

  return token
}

export function hasSignupSocialLinkHandoff(): boolean {
  return getSignupSocialLinkToken() != null
}
