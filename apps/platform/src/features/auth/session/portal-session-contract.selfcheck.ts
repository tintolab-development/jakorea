import assert from 'node:assert/strict'
import {
  PLATFORM_SESSION_POLICY_DISPLAY,
  resolveSessionWarningView,
} from '@jakorea/domain/session'
import {
  isPortalSessionApiAvailable,
  PORTAL_SESSION_BE_CONTRACT,
} from './portal-session-contract.ts'

assert.equal(isPortalSessionApiAvailable(), false)
assert.equal(PORTAL_SESSION_BE_CONTRACT, 'BLOCKED_BY_PORTAL_BE_CONTRACT')
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
