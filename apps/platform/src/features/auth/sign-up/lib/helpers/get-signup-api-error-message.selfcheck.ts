import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { getSignupApiErrorMessage } from './get-signup-api-error-message.ts'

function axiosErr(status: number, data: unknown, message = 'Request failed with status code 409') {
  return new AxiosError(message, undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

const fallback = '가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'

assert.equal(
  getSignupApiErrorMessage(
    axiosErr(409, {
      error: {
        code: 'PHONE_ALREADY_REGISTERED',
        message: '이미 가입된 휴대폰 번호입니다. 다른 번호로 인증해 주세요.',
        traceId: 'x',
      },
    }),
    fallback,
  ),
  '이미 가입된 휴대폰 번호입니다. 다른 번호로 인증해 주세요.',
)

assert.equal(
  getSignupApiErrorMessage(axiosErr(500, { message: '서버 오류' }), fallback),
  '서버 오류',
)

assert.equal(getSignupApiErrorMessage(axiosErr(409, {}), fallback), fallback)

console.log('get-signup-api-error-message.selfcheck: ok')
