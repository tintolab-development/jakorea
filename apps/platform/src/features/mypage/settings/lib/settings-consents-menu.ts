const SETTINGS_CONSENTS_MENU_PIN_KEY = 'jakorea.platform.mypage.settings-consents-always-visible'

export function pinSettingsConsentsMenu(): void {
  try {
    window.localStorage.setItem(SETTINGS_CONSENTS_MENU_PIN_KEY, '1')
  } catch {
    // storage 차단 시에도 이번 세션 이동은 유지한다.
  }
}

export function isSettingsConsentsMenuPinned(): boolean {
  try {
    return window.localStorage.getItem(SETTINGS_CONSENTS_MENU_PIN_KEY) === '1'
  } catch {
    return false
  }
}
