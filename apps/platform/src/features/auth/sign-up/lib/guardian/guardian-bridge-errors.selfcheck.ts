import assert from 'node:assert/strict'
import { resolveGuardianBridgeError } from './guardian-bridge-errors.ts'

function bridgeError(code: string, message: string, httpStatus: number) {
  return { name: 'GuardianSignupBridgeApiError', code, message, httpStatus }
}

const restart = resolveGuardianBridgeError(
  bridgeError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해 주세요.', 401),
)
assert.equal(restart.action, 'restart_profile')
assert.equal(restart.message.includes('이메일 또는 비밀번호'), false)

const invalidChallenge = resolveGuardianBridgeError(
  bridgeError(
    'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID',
    '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    401,
  ),
)
assert.equal(invalidChallenge.action, 'show_message')
assert.equal(invalidChallenge.code, 'GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID')

const conflict = resolveGuardianBridgeError(
  bridgeError('CONFLICT', '이미 처리된 요청입니다.', 409),
)
assert.equal(conflict.action, 'refetch_status')

const expired = resolveGuardianBridgeError(
  bridgeError('GONE', '세션이 만료되었습니다.', 410),
)
assert.equal(expired.action, 'restart_intent')

const disabled = resolveGuardianBridgeError(
  bridgeError(
    'GUARDIAN_SIGNUP_BRIDGE_NOT_ENABLED_PENDING_SECURITY_APPROVAL',
    'bridge off',
    503,
  ),
)
assert.equal(disabled.action, 'bridge_disabled')
assert.equal(disabled.message.includes('공용 본인인증'), true)

// GUARDIAN_* 확정 문구 — 401(세션 재시작)이어도 서버 message를 그대로 쓴다
for (const [code, status] of [
  ['GUARDIAN_STATUS_TOKEN_INVALID', 401],
  ['GUARDIAN_SESSION_EXPIRED', 410],
  ['GUARDIAN_INVALID_STATE', 409],
  ['GUARDIAN_NICE_ALREADY_STARTED', 409],
  ['GUARDIAN_NICE_START_IN_PROGRESS', 409],
  ['GUARDIAN_NICE_START_OUTCOME_UNKNOWN', 409],
  ['GUARDIAN_ALREADY_CONSENTED', 409],
  ['GUARDIAN_SIGNUP_INTENT_CONFLICT', 409],
  ['GUARDIAN_FINAL_CONSENT_CHALLENGE_INVALID', 401],
] as const) {
  const resolved = resolveGuardianBridgeError(bridgeError(code, `서버 확정 문구 ${code}`, status))
  assert.equal(resolved.message, `서버 확정 문구 ${code}`, code)
}
assert.equal(invalidChallenge.message, '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')

console.log('guardian-bridge-errors.selfcheck: ok')
