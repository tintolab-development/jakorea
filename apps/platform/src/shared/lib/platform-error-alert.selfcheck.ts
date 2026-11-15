/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/platform-error-alert.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { PLATFORM_ALERT_COPY, buildFileTypeInvalidAlertCopy } from './platform-alert-copy.ts'
import {
  buildRequestFailedAlertCopy,
  isPlatformNetworkError,
  isPlatformRateLimitedError,
  resolvePlatformErrorAlert,
} from './platform-error-alert.ts'

const axiosNoResponse = { isAxiosError: true, code: 'ERR_NETWORK', response: undefined }
const axiosTimeout = { isAxiosError: true, code: 'ECONNABORTED', response: undefined }
const axios429 = { isAxiosError: true, response: { status: 429, data: { message: '잠시 후' } } }
const axios400 = { isAxiosError: true, response: { status: 400, data: { message: '이미 신청했어요.' } } }
const axios502Empty = { isAxiosError: true, response: { status: 502, data: '' } }
const axiosCanceled = { isAxiosError: true, code: 'ERR_CANCELED', response: undefined }
const fetchFailed = Object.assign(new TypeError('Failed to fetch'))
const wrapped = Object.assign(new Error('첨부 업로드에 실패했습니다.'), { cause: fetchFailed })

assert.equal(isPlatformNetworkError(axiosNoResponse), true)
assert.equal(isPlatformNetworkError(axiosTimeout), true)
assert.equal(isPlatformNetworkError(axios502Empty), true)
assert.equal(isPlatformNetworkError(fetchFailed), true)
assert.equal(isPlatformNetworkError(wrapped), true)
assert.equal(isPlatformNetworkError(axiosCanceled), false)
assert.equal(isPlatformNetworkError(axios400), false)
assert.equal(isPlatformNetworkError(new Error('x')), false)
assert.equal(isPlatformRateLimitedError(axios429), true)
assert.equal(isPlatformRateLimitedError(axios400), false)

assert.deepEqual(resolvePlatformErrorAlert(axiosNoResponse), PLATFORM_ALERT_COPY.networkError)
assert.deepEqual(resolvePlatformErrorAlert(axios429), PLATFORM_ALERT_COPY.rateLimited)
assert.deepEqual(resolvePlatformErrorAlert(new Error('x')), PLATFORM_ALERT_COPY.requestFailed)
assert.deepEqual(
  resolvePlatformErrorAlert(axios400, {
    serverMessage: error => (error as typeof axios400).response.data.message,
  }),
  { title: '요청을 처리하지 못했어요.', description: '이미 신청했어요.' },
)
assert.deepEqual(buildRequestFailedAlertCopy('  '), PLATFORM_ALERT_COPY.requestFailed)
assert.deepEqual(buildFileTypeInvalidAlertCopy('PDF, JPG, PNG'), {
  title: '첨부파일 형식을 확인해 주세요.',
  description: '파일은 PDF, JPG, PNG 파일만 업로드할 수 있어요.',
})

console.log('platform-error-alert selfcheck: ok')
