import type { IdentityMessage } from './types'

export function postIdentityMessageToOpener(
  message: IdentityMessage,
  targetOrigin: string = window.location.origin
): boolean {
  if (!window.opener) {
    return false
  }
  window.opener.postMessage(message, targetOrigin)
  return true
}

export function closeIdentityPopupSoon(delayMs = 100) {
  window.setTimeout(() => {
    window.close()
  }, delayMs)
}
