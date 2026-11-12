import { isAxiosError } from 'axios'
import { BIRTH_DATE_FUTURE_MESSAGE, BIRTH_DATE_TOO_OLD_MESSAGE } from '../birth-date-bounds.ts'

/**
 * 서버 생년월일 범위 검증(BE-06·QA-0220) 코드 → 화면 입력 단계와 같은 문구.
 * 서버 문구 대신 클라이언트 문구를 써서 같은 조건에 같은 안내가 나가게 한다.
 */
const CLIENT_MESSAGE_BY_CODE: Readonly<Record<string, string>> = {
  BIRTH_DATE_FUTURE_NOT_ALLOWED: BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_TOO_OLD: BIRTH_DATE_TOO_OLD_MESSAGE,
}

export function getSignupApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const record = data as {
        message?: unknown
        error?: { code?: unknown; message?: unknown; traceId?: unknown }
      }
      const nestedCode =
        typeof record.error?.code === 'string' ? record.error.code.trim() : ''
      const clientMessage = nestedCode ? CLIENT_MESSAGE_BY_CODE[nestedCode] : undefined
      if (clientMessage) {
        return clientMessage
      }
      const nestedMessage = record.error?.message
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        const code = nestedCode
        const traceId =
          typeof record.error?.traceId === 'string' ? record.error.traceId.trim() : ''
        if (code || traceId) {
          console.warn('[signup-api-error]', { code: code || undefined, traceId: traceId || undefined })
        }
        return nestedMessage.trim()
      }
      const message = record.message
      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }
    }
    if (
      typeof error.message === 'string' &&
      error.message.trim() &&
      !/^Request failed with status code \d+/i.test(error.message)
    ) {
      return error.message.trim()
    }
  }

  if (
    error instanceof Error &&
    error.message.trim() &&
    !/^Request failed with status code \d+/i.test(error.message)
  ) {
    return error.message.trim()
  }

  return fallback
}
