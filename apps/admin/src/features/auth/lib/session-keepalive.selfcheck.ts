/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/auth/lib/session-keepalive.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS,
  PROACTIVE_REFRESH_AFTER_MS,
  shouldProactivelyRefresh,
} from './session-keepalive.ts'

const MIN = 60 * 1000
const NOW = 1_800_000_000_000

assert.equal(PROACTIVE_REFRESH_AFTER_MS, 20 * MIN)
assert.equal(PROACTIVE_REFRESH_ACTIVITY_WINDOW_MS, 30 * MIN)

assert.equal(
  shouldProactivelyRefresh({
    nowMs: NOW,
    lastIssuedAtMs: NOW - 19 * MIN,
    lastActivityAtMs: NOW - 1 * MIN,
  }),
  false
)

assert.equal(
  shouldProactivelyRefresh({
    nowMs: NOW,
    lastIssuedAtMs: NOW - 20 * MIN,
    lastActivityAtMs: NOW - 1 * MIN,
  }),
  true
)

assert.equal(
  shouldProactivelyRefresh({
    nowMs: NOW,
    lastIssuedAtMs: NOW - 45 * MIN,
    lastActivityAtMs: NOW - 31 * MIN,
  }),
  false
)

assert.equal(
  shouldProactivelyRefresh({
    nowMs: NOW,
    lastIssuedAtMs: NOW - 45 * MIN,
    lastActivityAtMs: NOW - 30 * MIN,
  }),
  true
)

assert.equal(
  shouldProactivelyRefresh({ nowMs: NOW, lastIssuedAtMs: null, lastActivityAtMs: NOW }),
  true
)

assert.equal(
  shouldProactivelyRefresh({
    nowMs: NOW,
    lastIssuedAtMs: null,
    lastActivityAtMs: NOW - 40 * MIN,
  }),
  false
)

console.log('session-keepalive selfcheck: ok')
