/**
 * 방문 세션 — 문서당 1회, TTL 안에서는 새로고침도 재호출하지 않는다.
 * 이벤트 POST는 캐시하지 않는다.
 */

import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { postMetricEvent, postVisitorSession } from '../api/client'
import type { VisitorSessionResponse } from '../api/types'

const STORAGE_KEY = 'ja_homepage_analytics_session_until'
/** 서버가 ttl을 생략하고 counted만 줄 때 새로고침 중복 집계를 막는다. */
const FALLBACK_TTL_SECONDS = 30 * 60

let started = false
let inflight: Promise<void> | null = null

function readUntil(): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const until = Number(raw)
    return Number.isFinite(until) ? until : null
  } catch {
    return null
  }
}

function writeUntil(epochMs: number) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(epochMs))
  } catch {
    // sessionStorage를 쓸 수 없으면 이 문서의 started 플래그만 유지한다.
  }
}

function isSuppressed(now = Date.now()): boolean {
  const until = readUntil()
  return until != null && until > now
}

function rememberSession(response: VisitorSessionResponse) {
  const ttl = response.ttlSeconds
  const seconds =
    typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0
      ? ttl
      : response.counted
        ? FALLBACK_TTL_SECONDS
        : 0
  if (seconds <= 0) return
  writeUntil(Date.now() + seconds * 1000)
}

/** 공개 레이아웃 최초 진입. 실패하면 다음 진입에서 다시 시도한다. */
export function ensureVisitorSession(): void {
  if (!isHomepageApiConfigured()) return
  if (started || inflight || isSuppressed()) {
    started = true
    return
  }
  started = true
  inflight = postVisitorSession()
    .then(response => {
      rememberSession(response)
    })
    .catch(() => {
      started = false
    })
    .finally(() => {
      inflight = null
    })
}

/** 메뉴·클릭 이벤트. 실패는 화면을 막지 않는다. */
export function recordMetric(metricCode: string): void {
  const code = metricCode.trim()
  if (!code || !isHomepageApiConfigured()) return
  void postMetricEvent(code).catch(() => {})
}
