import { isAxiosError } from 'axios'

export function getSignupApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const record = data as {
        message?: unknown
        error?: { code?: unknown; message?: unknown; traceId?: unknown }
      }
      const nestedMessage = record.error?.message
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        const code =
          typeof record.error?.code === 'string' ? record.error.code.trim() : ''
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
