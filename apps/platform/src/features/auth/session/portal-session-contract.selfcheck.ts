import assert from 'node:assert/strict'
import {
  PLATFORM_SESSION_POLICY_DISPLAY,
  resolveSessionWarningView,
} from '@jakorea/domain/session'
import {
  createPortalActivityTrackerState,
  processPortalActivityEvent,
} from './portal-activity-tracker.ts'

// BE 계약이 차단 상태여서는 안 된다 (JABACK main e9b5319 MEMBER Activity/Session 병합).
// 가용성 함수는 `import.meta.env`(Vite)에 의존하므로 여기서는 Activity 판정 규칙만 순수 검증한다.
{
  const state = createPortalActivityTrackerState()
  const t0 = 1_000_000
  assert.equal(processPortalActivityEvent({ type: 'pointerdown', isTrusted: false }, state, t0, false), 'ignored')
  assert.equal(processPortalActivityEvent({ type: 'scroll', isTrusted: true }, state, t0, false), 'ignored')
  assert.equal(processPortalActivityEvent({ type: 'touchstart', isTrusted: true }, state, t0, false), 'network')
  assert.equal(processPortalActivityEvent({ type: 'pointerdown', isTrusted: true }, state, t0 + 100, false), 'deduped')
  assert.equal(processPortalActivityEvent({ type: 'keydown', isTrusted: true }, state, t0 + 1_000, false), 'throttled')
  assert.equal(processPortalActivityEvent({ type: 'wheel', isTrusted: true }, state, t0 + 45_000, false), 'network')
  assert.equal(processPortalActivityEvent({ type: 'keydown', isTrusted: true }, state, t0 + 99_000, true), 'ignored')
}

// idle OFF: 유휴 기한이 지나도 유휴 경고 없음, 12h 절대 만료 5분 전 경고
{
  const base = {
    sessionStartedAt: '2026-11-08T00:00:00Z',
    absoluteExpiresAt: '2026-11-08T12:00:00Z',
    lastUserActivityAt: '2026-11-08T00:00:00Z',
    idleExpiresAt: null,
    refreshIdleExpiresAt: null,
    idlePolicyEnforced: false,
    serverNow: '2026-11-08T00:00:00Z',
  }
  assert.equal(resolveSessionWarningView({ session: base, nowMs: Date.parse('2026-11-08T00:26:00Z') }), null)
  assert.equal(
    resolveSessionWarningView({ session: base, nowMs: Date.parse('2026-11-08T11:56:00Z') })?.kind,
    'absolute',
  )
  // idle ON: 25분 경과 시 유휴 경고
  const idleOn = { ...base, idlePolicyEnforced: true, idleExpiresAt: '2026-11-08T00:30:00Z' }
  assert.equal(
    resolveSessionWarningView({ session: idleOn, nowMs: Date.parse('2026-11-08T00:26:00Z') })?.kind,
    'idle',
  )
}
assert.equal(
  resolveSessionWarningView({
    session: null,
    nowMs: Date.parse('2026-11-06T01:25:00Z'),
  }),
  null
)
assert.equal(PLATFORM_SESSION_POLICY_DISPLAY.idleTitle, '로그인이 곧 종료돼요.')
assert.equal(PLATFORM_SESSION_POLICY_DISPLAY.absoluteTitle, '로그인이 곧 종료돼요.')
assert.equal(
  PLATFORM_SESSION_POLICY_DISPLAY.idleBody,
  '장시간 이용하지 않아 5분 후 자동으로 로그아웃돼요.\n계속 이용하시려면 [로그인 연장]을 눌러 주세요.'
)
assert.equal(
  PLATFORM_SESSION_POLICY_DISPLAY.absoluteBody,
  '5분 후 로그인 유지 시간이 종료되어 자동으로 로그아웃돼요.\n계속 이용하시려면 로그아웃된 후 다시 로그인해 주세요.'
)
assert.equal(PLATFORM_SESSION_POLICY_DISPLAY.idleLogoutLabel, '로그아웃')
assert.equal(PLATFORM_SESSION_POLICY_DISPLAY.idleExtendLabel, '로그인 연장')
assert.equal(PLATFORM_SESSION_POLICY_DISPLAY.absoluteConfirmLabel, '확인')
console.log('portal-session-contract selfcheck: ok')
