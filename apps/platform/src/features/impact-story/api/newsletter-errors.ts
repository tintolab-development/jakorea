import { isAxiosError } from 'axios'

export const NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK =
  '뉴스레터 구독 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'

export const NEWSLETTER_SUBSCRIBE_ALREADY_SUBSCRIBED =
  '이미 구독 중인 이메일입니다.'

export const NEWSLETTER_SUBSCRIBE_INVALID_INPUT =
  '입력한 이름과 이메일을 다시 확인해 주세요.'

function readErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return undefined
}

export function getNewsletterSubscribeErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const code = readErrorCode(error.response?.data)
    if (status === 409 || code === 'CONFLICT' || code === 'ALREADY_SUBSCRIBED') {
      return NEWSLETTER_SUBSCRIBE_ALREADY_SUBSCRIBED
    }
    if (status === 400 || status === 422) {
      return NEWSLETTER_SUBSCRIBE_INVALID_INPUT
    }
  }
  return NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK
}
