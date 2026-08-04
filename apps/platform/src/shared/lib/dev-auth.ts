const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'
export const DEV_AUTH_CHANGE_EVENT = 'platform:dev-auth-change'

export function getDevAuthLoggedIn() {
  return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true'
}

export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (isLoggedIn) {
    window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true')
  } else {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
  }

  window.dispatchEvent(
    new CustomEvent(DEV_AUTH_CHANGE_EVENT, {
      detail: { isLoggedIn },
    }),
  )
}
