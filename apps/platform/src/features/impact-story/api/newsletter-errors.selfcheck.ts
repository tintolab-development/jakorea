import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import {
  getNewsletterSubscribeErrorMessage,
  NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK,
} from './newsletter-errors.ts'

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
  getNewsletterSubscribeErrorMessage(new Error('서비스를 사용할 수 없습니다.')),
  '서비스를 사용할 수 없습니다.',
)

assert.equal(
  getNewsletterSubscribeErrorMessage(axiosErr(409, {})),
  '이미 구독 중인 이메일입니다.',
)

assert.equal(
  getNewsletterSubscribeErrorMessage(
    axiosErr(400, { error: { message: '이메일 형식이 올바르지 않습니다.' } }),
  ),
  '이메일 형식이 올바르지 않습니다.',
)

assert.equal(getNewsletterSubscribeErrorMessage({}), NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK)
