import { isAxiosError } from 'axios'
import type { PlatformAlertCopy } from '../../../shared/lib/platform-alert-copy.ts'
import { resolvePlatformErrorAlert } from '../../../shared/lib/platform-error-alert.ts'

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

/** 구독 실패 중 이용자가 고칠 수 있는 경우(이미 구독·입력 오류) 안내 — 그 밖은 null */
function getNewsletterSubscribeBusinessMessage(error: unknown): string | null {
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
  return null
}

/**
 * 구독 요청 오류 팝업 — 시안 「오류 제한 팝업」(14491-2533)
 * 네트워크 오류·처리 제한·처리 실패 공통 문구, 이미 구독·입력 오류는 설명에 안내한다.
 */
export function getNewsletterSubscribeErrorAlert(error: unknown): PlatformAlertCopy {
  return resolvePlatformErrorAlert(error, { serverMessage: getNewsletterSubscribeBusinessMessage })
}
