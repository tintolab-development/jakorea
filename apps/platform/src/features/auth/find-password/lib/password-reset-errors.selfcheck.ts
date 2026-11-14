import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { readFindPasswordReturnState, resolvePasswordResetApiError } from './password-reset-errors.ts'

function axiosErr(status: number, data: unknown) {
  return new AxiosError(`Request failed with status code ${status}`, undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

assert.deepEqual(
  resolvePasswordResetApiError(
    axiosErr(401, { error: { code: 'PASSWORD_RESET_ACCOUNT_MISMATCH', field: 'email', message: '계정 불일치' } }),
  ),
  { kind: 'email', message: '계정 불일치' },
)
assert.deepEqual(
  resolvePasswordResetApiError(
    axiosErr(401, {
      error: { code: 'PASSWORD_RESET_CONFIRM_MISMATCH', field: 'newPasswordConfirm', message: '확인값 불일치' },
    }),
  ),
  { kind: 'confirm', message: '확인값 불일치' },
)
assert.deepEqual(
  resolvePasswordResetApiError(
    axiosErr(401, { error: { code: 'IDENTITY_VERIFICATION_SESSION_REQUIRED', message: '다시 인증' } }),
  ),
  { kind: 'restart-identity', message: '다시 인증' },
)
// 정책 위반(400)·본문 없는 오류는 기존 처리
assert.equal(
  resolvePasswordResetApiError(
    axiosErr(400, { error: { code: 'SIGNUP_PASSWORD_POLICY_VIOLATION', field: 'password', message: '정책' } }),
  ),
  null,
)
assert.equal(resolvePasswordResetApiError(axiosErr(502, '')), null)

assert.deepEqual(readFindPasswordReturnState({ findPasswordError: { field: 'email', message: ' x ' } }), {
  field: 'email',
  message: 'x',
})
assert.equal(readFindPasswordReturnState({ findPasswordError: { field: 'other', message: 'x' } }), null)
assert.equal(readFindPasswordReturnState(null), null)

console.log('password-reset-errors.selfcheck: ok')
