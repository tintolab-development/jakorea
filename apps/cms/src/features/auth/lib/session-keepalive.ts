/**
 * 관리자 세션 keep-alive.
 * 선제 refresh 게이트는 로컬 활동 시각, 서버 유휴는 Activity API가 정본.
 */

import {
  isTrustedUserActivityEvent,
  SESSION_ACTIVITY_NETWORK_THROTTLE_MS,
  SESSION_GESTURE_DEDUPE_MS,
  shouldIgnoreActivityTarget,
} from '@jakorea/domain/session'

export const REFRESH_TOKEN_STORAGE_KEY = 'auth_refresh_token'
export const TOKEN_ISSUED_AT_STORAGE_KEY = 'auth_issued_at'

export const PROACTIVE_REFRESH_AFTER_MS = 20 * 60 * 1000
export const PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS = 30 * 60 * 1000

const LOCAL_ACTIVITY_THROTTLE_MS = 1000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

let lastUserActivityAtMs = Date.now()
let warningActivitySuppressed = false

export function shouldProactivelyRefresh(input: {
  nowMs: number
  lastIssuedAtMs: number | null
  lastActivityAtMs: number
}): boolean {
  if (input.nowMs - input.lastActivityAtMs > PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS) {
    return false
  }
  if (input.lastIssuedAtMs == null) {
    return true
  }
  return input.nowMs - input.lastIssuedAtMs >= PROACTIVE_REFRESH_AFTER_MS
}

export function recordTokenIssuedAt(nowMs: number = Date.now()): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_ISSUED_AT_STORAGE_KEY, String(nowMs))
    }
  } catch {
    // storage 불가 환경은 무시
  }
}

export function readTokenIssuedAt(): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(TOKEN_ISSUED_AT_STORAGE_KEY)
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function clearTokenIssuedAt(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOKEN_ISSUED_AT_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function recordUserActivity(nowMs: number = Date.now()): void {
  lastUserActivityAtMs = nowMs
}

export function getLastUserActivityAt(): number {
  return lastUserActivityAtMs
}

export function resetUserActivityForTest(nowMs: number = Date.now()): void {
  lastUserActivityAtMs = nowMs
}

export function setSessionWarningActivitySuppressed(suppressed: boolean): void {
  warningActivitySuppressed = suppressed
}

type ServerActivityRecordedListener = () => void
const serverActivityRecordedListeners = new Set<ServerActivityRecordedListener>()

/**
 * Activity API가 서버 유휴 기한을 갱신했을 때 알린다.
 * 세션 경고 타이머는 GET Session의 idleExpiresAt만 정본으로 쓰므로, 갱신 직후 다시 읽어
 * 로그인 시점 기한에 머물지 않게 한다 (미사용 25분 = 자동 로그아웃 5분 전 안내).
 */
export function notifyServerActivityRecorded(): void {
  serverActivityRecordedListeners.forEach(listener => listener())
}

export function subscribeServerActivityRecorded(
  listener: ServerActivityRecordedListener
): () => void {
  serverActivityRecordedListeners.add(listener)
  return () => {
    serverActivityRecordedListeners.delete(listener)
  }
}

type ActivityTrackerState = {
  lastLocalAt: number
  lastNetworkAt: number
  lastGestureAt: number
  lastGestureType: string
}

export function createActivityTrackerState(): ActivityTrackerState {
  return { lastLocalAt: 0, lastNetworkAt: 0, lastGestureAt: 0, lastGestureType: '' }
}

export function processTrustedUserActivityEvent(
  event: { type?: string; isTrusted?: boolean; target?: EventTarget | null },
  state: ActivityTrackerState,
  onNetworkActivity?: () => void,
  nowMs: number = Date.now()
): 'ignored' | 'local' | 'network' {
  if (!isTrustedUserActivityEvent(event)) return 'ignored'
  if (
    warningActivitySuppressed ||
    shouldIgnoreActivityTarget(event.target ?? null) ||
    (typeof Element !== 'undefined' &&
      event.target instanceof Element &&
      event.target.closest('.session-warning-modal-wrap, .session-warning-modal-root'))
  ) {
    return 'ignored'
  }

  if (
    (event.type === 'pointerdown' && state.lastGestureType === 'touchstart') ||
    (event.type === 'touchstart' && state.lastGestureType === 'pointerdown')
  ) {
    if (nowMs - state.lastGestureAt < SESSION_GESTURE_DEDUPE_MS) return 'ignored'
  }
  state.lastGestureAt = nowMs
  state.lastGestureType = event.type ?? ''

  if (nowMs - state.lastLocalAt >= LOCAL_ACTIVITY_THROTTLE_MS) {
    state.lastLocalAt = nowMs
    recordUserActivity(nowMs)
  }
  if (onNetworkActivity && nowMs - state.lastNetworkAt >= SESSION_ACTIVITY_NETWORK_THROTTLE_MS) {
    state.lastNetworkAt = nowMs
    onNetworkActivity()
    return 'network'
  }
  return 'local'
}

export function startUserActivityTracking(
  target: Window = window,
  onNetworkActivity?: () => void
): () => void {
  const state = createActivityTrackerState()
  const onActivity = (event: Event) => {
    processTrustedUserActivityEvent(event, state, onNetworkActivity)
  }

  ACTIVITY_EVENTS.forEach(name => {
    target.addEventListener(name, onActivity, { passive: true })
  })
  return () => {
    ACTIVITY_EVENTS.forEach(name => {
      target.removeEventListener(name, onActivity)
    })
  }
}
