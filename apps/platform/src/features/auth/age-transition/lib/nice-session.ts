const NICE_SESSION_ID_KEY = 'platform:age-transition:nice-session-id'
const NICE_VALIDATED_KEY = 'platform:age-transition:nice-validated'
const COMPLETE_IDEMPOTENCY_KEY = 'platform:age-transition:complete-idempotency'
const IDENTITY_PENDING_KEY = 'platform:age-transition:identity-pending'

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function setAgeTransitionNiceSessionId(sessionId: number) {
  if (!canUseSessionStorage() || !Number.isFinite(sessionId) || sessionId <= 0) return
  window.sessionStorage.setItem(NICE_SESSION_ID_KEY, String(sessionId))
}

export function markAgeTransitionNiceValidated() {
  if (!canUseSessionStorage()) return
  window.sessionStorage.setItem(NICE_VALIDATED_KEY, '1')
}

export function hasAgeTransitionNiceValidated() {
  if (!canUseSessionStorage()) return false
  return window.sessionStorage.getItem(NICE_VALIDATED_KEY) === '1'
}

export function getAgeTransitionNiceSessionId(): number | null {
  if (!canUseSessionStorage()) return null
  const raw = window.sessionStorage.getItem(NICE_SESSION_ID_KEY)
  const sessionId = Number(raw)
  if (!raw || !Number.isFinite(sessionId) || sessionId <= 0) return null
  return sessionId
}

export function hasAgeTransitionNiceSession() {
  return getAgeTransitionNiceSessionId() != null && hasAgeTransitionNiceValidated()
}

export function clearAgeTransitionNiceSession() {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(NICE_SESSION_ID_KEY)
  window.sessionStorage.removeItem(NICE_VALIDATED_KEY)
  window.sessionStorage.removeItem(COMPLETE_IDEMPOTENCY_KEY)
}

export function getAgeTransitionCompleteIdempotencyKey() {
  if (!canUseSessionStorage()) return null
  const value = window.sessionStorage.getItem(COMPLETE_IDEMPOTENCY_KEY)?.trim()
  return value || null
}

export function ensureAgeTransitionCompleteIdempotencyKey() {
  const existing = getAgeTransitionCompleteIdempotencyKey()
  if (existing) return existing
  const next =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `age14-complete-${Date.now()}`
  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(COMPLETE_IDEMPOTENCY_KEY, next)
  }
  return next
}

/** NICE 콜백 팝업이 AGE14 세션 조회 경로를 쓰도록 localStorage로 공유 */
export function markAgeTransitionIdentityPending() {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(IDENTITY_PENDING_KEY, '1')
}

export function isAgeTransitionIdentityPending() {
  if (!canUseLocalStorage()) return false
  return window.localStorage.getItem(IDENTITY_PENDING_KEY) === '1'
}

export function clearAgeTransitionIdentityPending() {
  if (!canUseLocalStorage()) return
  window.localStorage.removeItem(IDENTITY_PENDING_KEY)
}
