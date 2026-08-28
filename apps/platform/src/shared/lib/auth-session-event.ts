/** 로그인·토큰·mock 세션 전환 시 카탈로그가 다시 읽도록 알린다. */
export const DEV_AUTH_CHANGE_EVENT = 'platform:dev-auth-change'

export function emitDevAuthChange(isLoggedIn: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(DEV_AUTH_CHANGE_EVENT, {
      detail: { isLoggedIn },
    }),
  )
}
