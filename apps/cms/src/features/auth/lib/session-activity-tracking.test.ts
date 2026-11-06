import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_ACTIVITY_NETWORK_THROTTLE_MS } from '@jakorea/domain/session'
import {
  createActivityTrackerState,
  getLastUserActivityAt,
  processTrustedUserActivityEvent,
  resetUserActivityForTest,
} from './session-keepalive'

describe('FE04 Activity throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T01:00:00Z'))
    resetUserActivityForTest(Date.now())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('신뢰 입력을 throttle 간격으로만 네트워크 Activity에 넘긴다', () => {
    const onNetwork = vi.fn()
    const state = createActivityTrackerState()

    expect(
      processTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: false }, state, onNetwork)
    ).toBe('ignored')
    expect(onNetwork).toHaveBeenCalledTimes(0)

    expect(
      processTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: true }, state, onNetwork)
    ).toBe('network')
    expect(onNetwork).toHaveBeenCalledTimes(1)

    expect(
      processTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: true }, state, onNetwork)
    ).toBe('local')
    expect(onNetwork).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(SESSION_ACTIVITY_NETWORK_THROTTLE_MS)
    expect(
      processTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: true }, state, onNetwork)
    ).toBe('network')
    expect(onNetwork).toHaveBeenCalledTimes(2)
    expect(getLastUserActivityAt()).toBe(Date.now())
  })

  it('한 제스처 touchstart+pointerdown 은 한 번만 전송한다', () => {
    const onNetwork = vi.fn()
    const state = createActivityTrackerState()
    processTrustedUserActivityEvent({ type: 'touchstart', isTrusted: true }, state, onNetwork)
    processTrustedUserActivityEvent({ type: 'pointerdown', isTrusted: true }, state, onNetwork)
    expect(onNetwork).toHaveBeenCalledTimes(1)
  })
})
