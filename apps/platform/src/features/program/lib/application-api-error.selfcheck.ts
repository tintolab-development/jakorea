/**
 * 봉사자 모집 대상 불일치(403)는 서버 영문 메시지 대신 고정 한글 안내를 쓴다.
 */
import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import {
  getApplicationApiErrorCode,
  getProgramApplicationApiErrorMessage,
  messageForApplicationBlockedReason,
} from './application-api-error.ts'

const MISMATCH = '모집 대상과 회원 구분이 일치하지 않아 신청할 수 없습니다.'

function axiosErr(data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status: 403,
    data,
    statusText: 'Forbidden',
    headers: {},
    config: {} as never,
  })
}

const mismatchBody = {
  success: false,
  error: {
    code: 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH',
    message: 'Volunteer recruitment target does not match member classification',
  },
}

assert.equal(messageForApplicationBlockedReason('VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'), MISMATCH)
assert.equal(getProgramApplicationApiErrorMessage(axiosErr(mismatchBody)), MISMATCH)
assert.equal(getApplicationApiErrorCode(axiosErr(mismatchBody)), 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH')

console.log('application-api-error.selfcheck: ok')
