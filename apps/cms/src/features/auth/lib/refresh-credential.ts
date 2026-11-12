/**
 * 관리자 refresh 수단 저장 헬퍼 — QA-0137 HttpOnly 쿠키(`JA_ADMIN_RT`) 전환기.
 *
 * - 전환기: 서버가 JSON 본문에도 refreshToken을 주므로 기존처럼 localStorage에 두고 refresh 본문으로 보낸다.
 *   쿠키는 브라우저가 refresh 경로(`/api/admin/auth/refresh`)에만 자동으로 실어 보낸다.
 * - 본문에 refreshToken이 없으면(운영 `JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false`) 이전 저장값은 서버가 이미
 *   rotate한 토큰이다. 다시 본문으로 보내면 서버가 본문을 쿠키보다 먼저 쓰므로 재사용 탐지(세션 전체 폐기)에 걸린다.
 *   그래서 이전 값은 지우고(undefined/null로 덮어쓰지 않음) "쿠키 세션" 표시만 남긴 뒤 본문 없이 쿠키로 refresh한다.
 *
 * axios-instance·auth-store·AuthProvider가 함께 쓰므로 순환 import를 피하려고 다른 모듈을 import하지 않는다.
 */

/** auth-store·axios-instance·session-keepalive와 같은 키 */
export const REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token'
/** 본문 없이 HttpOnly 쿠키로 refresh하는 세션 표시 (토큰 값은 저장하지 않음) */
export const REFRESH_COOKIE_SESSION_STORAGE_KEY = 'auth_refresh_cookie_session'

export type RefreshTokenRequestPayload = { refreshToken: string }

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

// TODO(QA-0137 인프라 전환 후 삭제): 운영에서 JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false 적용·쿠키 refresh 검증이 끝나면
// localStorage refreshToken 저장·조회를 지우고 항상 쿠키로만 refresh한다.
export function readStoredRefreshToken(): string | null {
  const storage = getStorage()
  if (!storage) return null
  const value = storage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  return value && value.trim() ? value : null
}

/**
 * 로그인·MFA·refresh 응답의 refreshToken 반영.
 * 있으면 저장(전환기), 없으면 쿠키 세션으로 표시하고 rotate된 이전 값을 지운다.
 */
export function storeRefreshTokenFromResponse(refreshToken: string | null | undefined): void {
  const storage = getStorage()
  if (!storage) return
  if (typeof refreshToken === 'string' && refreshToken.trim()) {
    // TODO(QA-0137 인프라 전환 후 삭제): 본문 refreshToken 저장 분기.
    storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
    storage.removeItem(REFRESH_COOKIE_SESSION_STORAGE_KEY)
    return
  }
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  storage.setItem(REFRESH_COOKIE_SESSION_STORAGE_KEY, '1')
}

/** refresh를 시도할 수단이 있는지 (저장된 refreshToken 또는 쿠키 세션 표시) */
export function hasRefreshCredential(): boolean {
  const storage = getStorage()
  if (!storage) return false
  return (
    readStoredRefreshToken() != null ||
    storage.getItem(REFRESH_COOKIE_SESSION_STORAGE_KEY) === '1'
  )
}

export function clearRefreshCredential(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  storage.removeItem(REFRESH_COOKIE_SESSION_STORAGE_KEY)
}

/**
 * refresh 요청 본문. 저장된 토큰이 있으면 전환기 본문, 없으면 본문 없이 쿠키만 쓴다.
 * TODO(QA-0137 인프라 전환 후 삭제): 본문 분기를 지우고 항상 undefined(쿠키만).
 */
export function buildRefreshRequestBody(
  storedRefreshToken: string | null,
): RefreshTokenRequestPayload | undefined {
  return storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined
}
