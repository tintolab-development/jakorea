import { describe, expect, it } from 'vitest'
import {
  PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS,
  PROACTIVE_REFRESH_AFTER_MS,
  shouldProactivelyRefresh,
} from './session-keepalive'

const MIN = 60 * 1000
const NOW = 1_800_000_000_000

describe('shouldProactivelyRefresh (활동 게이트)', () => {
  it('상수는 20분 / 30분이다', () => {
    expect(PROACTIVE_REFRESH_AFTER_MS).toBe(20 * MIN)
    expect(PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS).toBe(30 * MIN)
  })

  it('활동 중 + 발급 후 20분 미만이면 refresh하지 않는다', () => {
    expect(
      shouldProactivelyRefresh({
        nowMs: NOW,
        lastIssuedAtMs: NOW - 19 * MIN,
        lastActivityAtMs: NOW - 1 * MIN,
      }),
    ).toBe(false)
  })

  it('활동 중 + 발급 후 20분 이상이면 refresh한다', () => {
    expect(
      shouldProactivelyRefresh({
        nowMs: NOW,
        lastIssuedAtMs: NOW - 20 * MIN,
        lastActivityAtMs: NOW - 1 * MIN,
      }),
    ).toBe(true)
  })

  it('마지막 활동이 30분을 넘었으면 20분이 지나도 선제 refresh하지 않는다', () => {
    expect(
      shouldProactivelyRefresh({
        nowMs: NOW,
        lastIssuedAtMs: NOW - 45 * MIN,
        lastActivityAtMs: NOW - 31 * MIN,
      }),
    ).toBe(false)
    expect(
      shouldProactivelyRefresh({
        nowMs: NOW,
        lastIssuedAtMs: NOW - 45 * MIN,
        lastActivityAtMs: NOW - 30 * MIN,
      }),
    ).toBe(true)
  })

  it('발급 시각 기록이 없으면(기존 세션) 활동 중일 때 refresh한다', () => {
    expect(
      shouldProactivelyRefresh({ nowMs: NOW, lastIssuedAtMs: null, lastActivityAtMs: NOW }),
    ).toBe(true)
    expect(
      shouldProactivelyRefresh({
        nowMs: NOW,
        lastIssuedAtMs: null,
        lastActivityAtMs: NOW - 40 * MIN,
      }),
    ).toBe(false)
  })
})
