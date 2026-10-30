const LOGIN_EPOCH_KEY = 'platform:age-transition:login-epoch'
const DISMISSED_EPOCH_KEY = 'platform:age-transition:later-epoch'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function createEpoch() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `login-${Date.now()}`
}

/** 신규 로그인마다 호출. LATER는 이 epoch에서만 안내를 닫는다. */
export function beginAgeTransitionLoginScope() {
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(LOGIN_EPOCH_KEY, createEpoch())
}

export function dismissAgeTransitionNoticeThisLogin() {
  if (!canUseSessionStorage()) return
  const epoch = window.sessionStorage.getItem(LOGIN_EPOCH_KEY)
  if (!epoch) return
  window.sessionStorage.setItem(DISMISSED_EPOCH_KEY, epoch)
}

export function isAgeTransitionNoticeDismissedThisLogin() {
  if (!canUseSessionStorage()) return false
  const epoch = window.sessionStorage.getItem(LOGIN_EPOCH_KEY)
  const dismissed = window.sessionStorage.getItem(DISMISSED_EPOCH_KEY)
  return Boolean(epoch && dismissed && epoch === dismissed)
}
