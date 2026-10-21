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

console.log('guardian-bridge-errors.selfcheck: ok')
