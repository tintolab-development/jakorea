/**
 * 홈페이지 어드민 세션 keep-alive 규칙 (CMS와 동일).
 *
 * 배경: BE는 admin refresh 때 "마지막 refresh(발급)로부터 30분(idle)"을 검사한다 (API 호출로는 갱신되지 않음).
 * access TTL이 1시간이면 만료 직전에 refresh하는 것만으로는 BE idle에 걸리므로,
 * 사용자가 활동 중일 때는 발급 후 20분이 지나면 미리 refresh한다.
 *
 * - 마지막 토큰 발급 시각: localStorage(`hp_admin_auth_issued_at`) — 새로고침/다른 탭과 공유.
 * - 마지막 사용자 활동 시각: 탭별 메모리 (pointerdown/keydown/wheel/touchstart, 1초 throttle).
 * - 활동이 30분 넘게 없으면 선제 refresh는 하지 않는다 (만료 임박 시 refresh-first 시도는 별도로 유지).
 *
 * 키 문자열은 auth-storage `AUTH_ISSUED_AT_KEY`와 같아야 한다 (순환 import 방지용 사본).
 */

export const TOKEN_ISSUED_AT_STORAGE_KEY = 'hp_admin_auth_issued_at'

/** 발급 후 이 시간이 지나면 (활동 중일 때) 선제 refresh */
export const PROACTIVE_REFRESH_AFTER_MS = 20 * 60 * 1000
/** 마지막 활동이 이 시간 이내여야 선제 refresh */
export const PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS = 30 * 60 * 1000

const ACTIVITY_THROTTLE_MS = 1000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

let lastUserActivityAtMs = Date.now()

export function shouldProactivelyRefresh(input: {
  nowMs: number
  /** localStorage에 기록이 없으면 null (배포 직후 기존 세션 등) → 활동 중이면 refresh */
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

export function startUserActivityTracking(target: Window = window): () => void {
  let lastRecordedAt = 0
  const onActivity = () => {
    const now = Date.now()
    if (now - lastRecordedAt < ACTIVITY_THROTTLE_MS) return
    lastRecordedAt = now
    recordUserActivity(now)
  }
  ACTIVITY_EVENTS.forEach(event => {
    target.addEventListener(event, onActivity, { passive: true })
  })
  return () => {
    ACTIVITY_EVENTS.forEach(event => {
      target.removeEventListener(event, onActivity)
    })
  }
}
