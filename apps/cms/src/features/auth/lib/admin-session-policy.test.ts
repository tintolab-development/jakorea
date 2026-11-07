/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import {
  createSessionWarningDismissState,
  isSessionIdleStillValid,
  isTrustedUserActivityEvent,
  parseAdminAuthActivityResponse,
  parseAdminAuthSessionResponse,
  readJwtSidClaim,
  resolveSessionWarningView,
  SESSION_ABSOLUTE_MAX_MS,
  SESSION_IDLE_MAX_MS,
  SESSION_REEXPOSE_INTERVAL_MS,
  SESSION_WARNING_LEAD_MS,
  shouldIgnoreActivityTarget,
} from '@jakorea/domain/session'

const NOW = Date.parse('2026-11-06T01:25:00Z')

function session(overrides: Partial<ReturnType<typeof parseAdminAuthSessionResponse>> = {}) {
  return parseAdminAuthSessionResponse({
    sessionStartedAt: '2026-11-06T01:00:00Z',
    absoluteExpiresAt: '2026-11-06T13:00:00Z',
    lastUserActivityAt: '2026-11-06T01:20:00Z',
    idleExpiresAt: '2026-11-06T01:50:00Z',
    refreshIdleExpiresAt: '2026-11-06T01:50:00Z',
    idlePolicyEnforced: true,
    serverNow: '2026-11-06T01:25:00Z',
    ...overrides,
  })
}

describe('admin session policy', () => {
  it('FE16 절대 만료는 12시간이다', () => {
    expect(SESSION_ABSOLUTE_MAX_MS).toBe(12 * 60 * 60 * 1000)
    expect(SESSION_IDLE_MAX_MS).toBe(30 * 60 * 1000)
    expect(SESSION_WARNING_LEAD_MS).toBe(5 * 60 * 1000)
  })

  it('bare JSON activity/session 을 파싱하고 success 래핑을 강제하지 않는다', () => {
    expect(
      parseAdminAuthActivityResponse({
        lastUserActivityAt: '2026-11-06T01:20:00Z',
        updated: false,
      })
    ).toEqual({ lastUserActivityAt: '2026-11-06T01:20:00Z', updated: false })
    expect(session()?.idlePolicyEnforced).toBe(true)
  })

  it('FE07 유휴 5분 전 경고', () => {
    const view = resolveSessionWarningView({
      session: session({ idleExpiresAt: '2026-11-06T01:29:00Z' }),
      nowMs: NOW,
    })
    expect(view?.kind).toBe('idle')
    expect(view?.remainingMs).toBe(4 * 60 * 1000)
  })

  it('FE08 절대 5분 전 경고', () => {
    const view = resolveSessionWarningView({
      session: session({
        idleExpiresAt: null,
        idlePolicyEnforced: false,
        absoluteExpiresAt: '2026-11-06T01:29:00Z',
      }),
      nowMs: NOW,
    })
    expect(view?.kind).toBe('absolute')
  })

  it('FE15 정책 OFF면 유휴 경고를 만들지 않는다', () => {
    expect(
      resolveSessionWarningView({
        session: session({ idlePolicyEnforced: false, idleExpiresAt: null }),
        nowMs: NOW,
      })
    ).toBeNull()
  })

  it('FE23 동시 만료는 절대 만료를 우선한다', () => {
    const view = resolveSessionWarningView({
      session: session({
        idleExpiresAt: '2026-11-06T01:29:00Z',
        absoluteExpiresAt: '2026-11-06T01:29:00Z',
      }),
      nowMs: NOW,
    })
    expect(view?.kind).toBe('absolute')
  })

  it('FE23 더 먼저 만료되는 유휴를 우선한다', () => {
    const view = resolveSessionWarningView({
      session: session({
        idleExpiresAt: '2026-11-06T01:28:00Z',
        absoluteExpiresAt: '2026-11-06T01:29:00Z',
      }),
      nowMs: NOW,
    })
    expect(view?.kind).toBe('idle')
  })

  it('FE10 updated=false 만으로 연장을 성공 처리하지 않는다', () => {
    const current = session({ idleExpiresAt: '2026-11-06T01:28:00Z' })!
    expect(isSessionIdleStillValid(current, NOW, '2026-11-06T01:28:00Z')).toBe(false)
  })

  it('FE09 유휴 기한이 경고 구간 밖으로 늘어나면 연장 성공', () => {
    const next = session({ idleExpiresAt: '2026-11-06T01:55:00Z' })!
    expect(isSessionIdleStillValid(next, NOW, '2026-11-06T01:28:00Z')).toBe(true)
  })

  it('절대 만료가 임박하면 유휴 갱신을 연장 성공으로 보지 않는다', () => {
    const next = session({
      idleExpiresAt: '2026-11-06T01:55:00Z',
      absoluteExpiresAt: '2026-11-06T01:28:00Z',
    })!
    expect(isSessionIdleStillValid(next, NOW, '2026-11-06T01:20:00Z')).toBe(false)
  })

  it('FE22 같은 만료 시각은 1분 뒤 재노출한다', () => {
    const state = createSessionWarningDismissState()
    state.dismiss('idle', NOW + 60_000, NOW)
    expect(state.shouldShow('idle', NOW + 60_000, NOW + 10_000)).toBe(false)
    expect(state.shouldShow('idle', NOW + 60_000, NOW + SESSION_REEXPOSE_INTERVAL_MS)).toBe(true)
    state.resetIfExpiryChanged('idle', NOW + 120_000)
    expect(state.shouldShow('idle', NOW + 120_000, NOW + 1_000)).toBe(true)
  })

  it('FE05 비신뢰 이벤트는 Activity가 아니다', () => {
    expect(isTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: false })).toBe(false)
    expect(isTrustedUserActivityEvent({ type: 'click', isTrusted: true })).toBe(false)
    expect(isTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: true })).toBe(true)
  })

  it('FE06 경고 모달 내부 target은 Activity 제외', () => {
    const root = document.createElement('div')
    root.setAttribute('data-session-warning-root', 'true')
    const button = document.createElement('button')
    root.appendChild(button)
    document.body.appendChild(root)
    expect(shouldIgnoreActivityTarget(button)).toBe(true)
    expect(shouldIgnoreActivityTarget(document.body)).toBe(false)
    root.remove()
  })

  it('FE13 sid 없는 JWT는 claim이 없다', () => {
    const payload = btoa(JSON.stringify({ sub: 'admin' })).replace(/=+$/, '')
    expect(readJwtSidClaim(`aaa.${payload}.sig`)).toBeNull()
    const withSid = btoa(JSON.stringify({ sid: 'sess-1' })).replace(/=+$/, '')
    expect(readJwtSidClaim(`aaa.${withSid}.sig`)).toBe('sess-1')
  })
})
