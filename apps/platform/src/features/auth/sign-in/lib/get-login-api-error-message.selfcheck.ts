/**
 * 로그인 API 에러 — 승인 대기(423)는 고정 한글 문구.
 */
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import {
  formatPortalProfileUpdateError,
  getLoginApiErrorMessage,
  LOGIN_APPROVAL_PENDING_MESSAGE,
} from './get-login-api-error-message.ts'

function axiosErr(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

const fallback = '로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.'

assert.equal(
  getLoginApiErrorMessage(
    axiosErr(423, { error: { code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' } }),
    fallback,
  ),
  LOGIN_APPROVAL_PENDING_MESSAGE,
)

assert.equal(
  getLoginApiErrorMessage(axiosErr(423, { message: 'Locked' }), fallback),
  LOGIN_APPROVAL_PENDING_MESSAGE,
)

assert.equal(
  getLoginApiErrorMessage(
    axiosErr(403, { error: { code: 'PENDING_VERIFICATION', message: 'pending' } }),
    fallback,
  ),
  LOGIN_APPROVAL_PENDING_MESSAGE,
)

assert.equal(
  getLoginApiErrorMessage(
    axiosErr(401, { error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } }),
    fallback,
  ),
  '이메일 또는 비밀번호가 올바르지 않습니다.',
)

assert.equal(getLoginApiErrorMessage(new Error('network'), fallback), 'network')
assert.equal(getLoginApiErrorMessage(undefined, fallback), fallback)

assert.equal(
  formatPortalProfileUpdateError(
    axiosErr(400, {
      error: {
        code: 'GUARDIAN_RELATION_INVALID',
        message: '보호자 관계를 확인해 주세요. 관계는 1~64자여야 합니다.',
      },
    }),
    '회원 정보를 수정하지 못했습니다.',
  ),
  '보호자 관계를 확인해 주세요. 관계는 1~64자여야 합니다.',
)

assert.equal(
  getLoginApiErrorMessage(
    axiosErr(409, { error: { code: 'SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY' } }),
    '회원 정보를 수정하지 못했습니다.',
  ),
  '정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.',
)

assert.equal(
  formatPortalProfileUpdateError(
    axiosErr(409, { error: { code: 'SETTLEMENT_ACCOUNT_UPDATE_VIA_CONSENT_ONLY' } }),
    '회원 정보를 수정하지 못했습니다.',
  ),
  '정산 계좌는 지급조서 사전 동의서에서만 입력·수정할 수 있습니다.',
)

console.log('get-login-api-error-message.selfcheck: ok')
