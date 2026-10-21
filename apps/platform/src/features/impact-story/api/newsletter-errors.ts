import { isAxiosError } from 'axios'

export const NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK =
  '뉴스레터 구독 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'

function readErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return undefined
}

function readErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as { message?: unknown; error?: { message?: unknown } }
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim()
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim()
  }
  return undefined
}

export function getNewsletterSubscribeErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data
    const message = readErrorMessage(data)
    if (message) return message
    if (status === 409) return '이미 구독 중인 이메일입니다.'
    const code = readErrorCode(data)
    if (code === 'CONFLICT' || code === 'ALREADY_SUBSCRIBED') {
      return '이미 구독 중인 이메일입니다.'
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  return NEWSLETTER_SUBSCRIBE_ERROR_FALLBACK
}
