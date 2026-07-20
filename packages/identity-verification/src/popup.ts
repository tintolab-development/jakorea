const NICE_POPUP_NAME = 'authNiceWeb'
const NICE_POPUP_FEATURES =
  'width=480,height=812,top=100,fullscreen=no,menubar=no,status=no,titlebar=yes,location=no,toolbar=no,scrollbar=no'
const POPUP_CLOSED_POLL_MS = 500

export class NiceAuthPopupBlockedError extends Error {
  constructor() {
    super('팝업이 차단되었습니다. 브라우저에서 팝업 허용 후 다시 시도해 주세요.')
    this.name = 'NiceAuthPopupBlockedError'
  }
}

/** 사용자 클릭 직후(동기) 호출 — `await` 이후에는 브라우저가 팝업을 차단할 수 있음 */
export function openNiceAuthPopupWindow(): Window {
  const popup = window.open('about:blank', NICE_POPUP_NAME, NICE_POPUP_FEATURES)
  if (!popup) {
    throw new NiceAuthPopupBlockedError()
  }
  return popup
}

export function navigateNiceAuthPopup(popup: Window, authUrl: string): void {
  popup.location.href = authUrl
}

export function openNiceAuthPopup(authUrl: string): Window {
  const popup = openNiceAuthPopupWindow()
  navigateNiceAuthPopup(popup, authUrl)
  return popup
}

export function watchNiceAuthPopupClosed(popup: Window, onClosed: () => void): () => void {
  const timer = window.setInterval(() => {
    if (popup.closed) {
      window.clearInterval(timer)
      onClosed()
    }
  }, POPUP_CLOSED_POLL_MS)

  return () => {
    window.clearInterval(timer)
  }
}
