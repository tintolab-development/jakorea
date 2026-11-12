/**
 * 관리자 access token 보관소 — QA-0137 「access token의 스크립트 노출 범위 제한」.
 *
 * - access token은 이 모듈의 메모리(와 auth-store 상태)에만 둔다. localStorage·sessionStorage에 쓰지 않는다.
 * - 새로고침하면 토큰이 사라지므로 auth-store가 refresh(저장된 refreshToken 또는 HttpOnly 쿠키)로 다시 받는다.
 * - 다른 탭은 이 값을 읽을 수 없다. 탭마다 탭 간 잠금(axios-instance `navigator.locks`) 아래에서 refresh한다.
 *
 * auth-store·axios-instance·auth-service·social-auth가 함께 쓰므로 순환 import를 피하려고 다른 모듈을 import하지 않는다.
 * 값은 auth-store 구독으로만 바뀐다 (`useAuthStore.setState({ token })` → `writeAccessTokenToMemory`).
 */

/** 이전 버전이 localStorage에 남긴 access token 키 — 읽지 않고 지우기만 한다 */
export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'auth_token'

let accessTokenInMemory: string | null = null

export function readAccessTokenFromMemory(): string | null {
  return accessTokenInMemory
}

/** auth-store 구독 전용. 다른 곳에서 직접 부르지 않는다. */
export function writeAccessTokenToMemory(token: string | null | undefined): void {
  accessTokenInMemory = typeof token === 'string' && token.trim() ? token : null
}

/** 이전 버전이 저장해 둔 access token을 지운다 (앱 시작·토큰 발급·로그아웃 때) */
export function removeLegacyAccessTokenFromStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // 저장소 접근이 막힌 환경 — 지울 값도 읽을 수 없으므로 무시
  }
}
