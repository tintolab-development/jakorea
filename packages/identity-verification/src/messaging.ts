import { publishIdentityCompletion } from './completion-channel'
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

/**
 * 팝업 opener가 없어도 부모 탭이 결과를 받을 수 있게
 * localStorage + BroadcastChannel로도 전달한다.
 */
export function deliverIdentityMessage(
  message: IdentityMessage,
  storagePrefix: string,
  targetOrigin: string = window.location.origin
): { delivered: boolean; openerPosted: boolean } {
  publishIdentityCompletion(storagePrefix, message)
  const openerPosted = postIdentityMessageToOpener(message, targetOrigin)
  return { delivered: true, openerPosted }
}

export function closeIdentityPopupSoon(delayMs = 100) {
  window.setTimeout(() => {
    window.close()
  }, delayMs)
}

/** 팝업이면 닫고, 같은 창 콜백이면 가입 화면으로 되돌린다. */
export function closeIdentityPopupOrResume(resumePath: string, delayMs = 120) {
  window.setTimeout(() => {
    window.close()
    window.setTimeout(() => {
      if (window.closed) {
        return
      }
      if (!resumePath || resumePath === window.location.pathname) {
        return
      }
      window.location.replace(resumePath)
    }, 80)
  }, delayMs)
}
