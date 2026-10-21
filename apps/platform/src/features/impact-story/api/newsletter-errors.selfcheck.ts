import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import {
  getNewsletterSubscribeErrorMessage,
  NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK,
} from './newsletter-errors.ts'
import { parseNewsletterSubscribeResponse } from './newsletter-parse.ts'
import {
  getNewsletterSubscribeResultCopy,
  isNewsletterSubscribeAccepted,
  resolveNewsletterSubscribeUi,
} from './newsletter-result.ts'

function axiosErr(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

assert.equal(
  getNewsletterSubscribeErrorMessage(new Error('Network Error')),
  NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK,
)

assert.equal(
  getNewsletterSubscribeErrorMessage(new Error('timeout of 8000ms exceeded')),
  NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK,
)

assert.equal(
  getNewsletterSubscribeErrorMessage(axiosErr(409, {})),
  '이미 구독 중인 이메일입니다.',
)

assert.equal(
  getNewsletterSubscribeErrorMessage(
    axiosErr(400, { error: { message: '이메일 형식이 올바르지 않습니다.' } }),
  ),
  '입력한 이름과 이메일을 다시 확인해 주세요.',
)

assert.equal(
  getNewsletterSubscribeErrorMessage(
    axiosErr(500, { message: 'Errors.List.NoEmail' }),
  ),
  NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK,
)

assert.equal(getNewsletterSubscribeErrorMessage({}), NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK)

assert.equal(
  getNewsletterSubscribeResultCopy({
    status: 'PENDING',
    message: '구독 확인 절차를 진행해주세요.',
  }).title,
  '구독 확인 메일을 확인해 주세요',
)

assert.equal(
  getNewsletterSubscribeResultCopy({
    status: 'PENDING',
    message: '구독 확인 절차를 진행해주세요.',
  }).description,
  '구독 확인 절차를 진행해주세요.',
)

assert.equal(
  getNewsletterSubscribeResultCopy({ status: 'SUBSCRIBED' }).title,
  '뉴스레터 구독이 완료되었어요',
)

assert.equal(
  getNewsletterSubscribeResultCopy({
    status: 'FAILED',
    message: '구독 신청은 저장됐지만 스티비 동기화에 실패했습니다. (Errors.List.NoEmail)',
  }).title,
  '뉴스레터 구독에 실패했어요',
)

assert.equal(
  getNewsletterSubscribeResultCopy({
    status: 'FAILED',
    message: '구독 신청은 저장됐지만 스티비 동기화에 실패했습니다. (Errors.List.NoEmail)',
  }).description,
  '지금은 구독을 완료하지 못했습니다.\n잠시 후 다시 시도해 주세요.',
)

assert.notEqual(
  getNewsletterSubscribeResultCopy({ status: 'SKIPPED_LOCAL' }).title,
  '뉴스레터 구독이 완료되었어요',
)

assert.notEqual(
  getNewsletterSubscribeResultCopy({ status: 'UNKNOWN' }).title,
  '뉴스레터 구독이 완료되었어요',
)

assert.equal(isNewsletterSubscribeAccepted('PENDING'), true)
assert.equal(isNewsletterSubscribeAccepted('SUBSCRIBED'), true)
assert.equal(isNewsletterSubscribeAccepted('FAILED'), false)
assert.equal(isNewsletterSubscribeAccepted('SKIPPED_LOCAL'), false)

assert.equal(resolveNewsletterSubscribeUi('PENDING'), 'confirm-email')
assert.equal(resolveNewsletterSubscribeUi('SUBSCRIBED'), 'complete')
assert.equal(resolveNewsletterSubscribeUi('FAILED'), 'error')
assert.equal(resolveNewsletterSubscribeUi('SKIPPED_LOCAL'), 'error')
assert.equal(resolveNewsletterSubscribeUi(undefined), 'error')

assert.equal(
  parseNewsletterSubscribeResponse({
    status: 'PENDING',
    message: '구독 확인 메일을 발송했습니다. 메일함에서 확인을 완료해 주세요.',
  }).status,
  'PENDING',
)
assert.equal(
  parseNewsletterSubscribeResponse({
    status: 'FAILED',
    message: '구독 신청은 저장됐지만 스티비 동기화에 실패했습니다. (Errors.List.NoEmail)',
  }).status,
  'FAILED',
)
assert.equal(
  parseNewsletterSubscribeResponse({
    success: true,
    data: { status: 'SUBSCRIBED', message: '뉴스레터 구독이 완료되었습니다.' },
  }).status,
  'SUBSCRIBED',
)

const failedCopy = getNewsletterSubscribeResultCopy({
  status: 'FAILED',
  message: '구독 신청은 저장됐지만 스티비 동기화에 실패했습니다. (Errors.List.NoEmail)',
})
assert.equal(failedCopy.description.includes('스티비'), false)
assert.equal(failedCopy.description.includes('Errors.List'), false)
assert.equal(failedCopy.description.includes('확인 메일'), false)
assert.equal(failedCopy.description.includes('구독이 완료'), false)
