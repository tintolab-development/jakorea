import {
  isTrustedUserActivityEvent,
  SESSION_ACTIVITY_NETWORK_THROTTLE_MS,
  SESSION_GESTURE_DEDUPE_MS,
  shouldIgnoreActivityTarget,
  type ActivityEventLike,
} from '@jakorea/domain/session'

/** 실제 사용자 입력만. scroll·visibilitychange·focus·타이머·자동 API는 Activity가 아니다. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

export type PortalActivityTrackerState = {
  lastNetworkAt: number
  lastGestureAt: number
  lastGestureType: string
}

export function createPortalActivityTrackerState(): PortalActivityTrackerState {
  return { lastNetworkAt: 0, lastGestureAt: 0, lastGestureType: '' }
}

/**
 * 이벤트 1건 판정.
 * - `isTrusted !== true`(synthetic) 무시
 * - `[data-session-warning-root]` 내부(경고 모달 버튼·키 입력) 무시 — '로그인 연장'은 명시 호출로만
 * - touchstart↔pointerdown 400ms 이내는 한 제스처로 보고 중복 제거
 * - 네트워크 전송은 45초 throttle (BE 60초 DB 기록 억제와 별개)
 */
export function processPortalActivityEvent(
  event: ActivityEventLike,
  state: PortalActivityTrackerState,
  nowMs: number,
  suppressed: boolean,
): 'ignored' | 'deduped' | 'throttled' | 'network' {
  if (suppressed) return 'ignored'
  if (!isTrustedUserActivityEvent(event)) return 'ignored'
  if (shouldIgnoreActivityTarget(event.target ?? null)) return 'ignored'

  const type = event.type ?? ''
  const isPairedGesture =
    (type === 'pointerdown' && state.lastGestureType === 'touchstart') ||
    (type === 'touchstart' && state.lastGestureType === 'pointerdown')
  if (isPairedGesture && nowMs - state.lastGestureAt < SESSION_GESTURE_DEDUPE_MS) {
    return 'deduped'
  }
  state.lastGestureAt = nowMs
  state.lastGestureType = type

  if (nowMs - state.lastNetworkAt < SESSION_ACTIVITY_NETWORK_THROTTLE_MS) return 'throttled'
  state.lastNetworkAt = nowMs
  return 'network'
}

/** window에 수집기를 붙이고 해제 함수를 돌려준다. StrictMode 재마운트 시 cleanup으로 중복 등록을 막는다. */
export function startPortalActivityTracking(input: {
  onNetworkActivity: () => void
  isSuppressed: () => boolean
  target?: Window
}): () => void {
  const target = input.target ?? window
  const state = createPortalActivityTrackerState()
  const onEvent = (event: Event) => {
    const result = processPortalActivityEvent(event, state, Date.now(), input.isSuppressed())
    if (result === 'network') input.onNetworkActivity()
  }
  ACTIVITY_EVENTS.forEach(name => {
    target.addEventListener(name, onEvent, { passive: true, capture: true })
  })
  return () => {
    ACTIVITY_EVENTS.forEach(name => {
      target.removeEventListener(name, onEvent, { capture: true })
    })
  }
}
