import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { getSignupApiErrorMessage } from './get-signup-api-error-message.ts'
import { BIRTH_DATE_FUTURE_MESSAGE, BIRTH_DATE_TOO_OLD_MESSAGE } from '../birth-date-bounds.ts'

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

// BE-06·QA-0220: 서버 생년월일 범위 코드는 화면 입력 단계 문구로 맞춘다.
assert.equal(
  getSignupApiErrorMessage(
    axiosErr(400, {
      error: {
        code: 'BIRTH_DATE_FUTURE_NOT_ALLOWED',
        message: '생년월일은 오늘 이후 날짜로 입력할 수 없습니다.',
        field: 'birthDate',
        traceId: 'x',
      },
    }),
    fallback,
  ),
  BIRTH_DATE_FUTURE_MESSAGE,
)

assert.equal(
  getSignupApiErrorMessage(
    axiosErr(400, { error: { code: 'BIRTH_DATE_TOO_OLD', message: '입력값을 확인해 주세요.' } }),
    fallback,
  ),
  BIRTH_DATE_TOO_OLD_MESSAGE,
)

assert.equal(
  getSignupApiErrorMessage(axiosErr(400, { error: { code: ' BIRTH_DATE_TOO_OLD ' } }), fallback),
  BIRTH_DATE_TOO_OLD_MESSAGE,
)

console.log('get-signup-api-error-message.selfcheck: ok')
