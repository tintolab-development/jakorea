const DEV_AUTH_STORAGE_KEY = 'platform:dev:is-logged-in'

export function getDevAuthLoggedIn() {
  return window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === 'true'
}

export function setDevAuthLoggedIn(isLoggedIn: boolean) {
  if (isLoggedIn) {
    window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, 'true')
    return
  }

  window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY)
}
