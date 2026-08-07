import { isAxiosError } from 'axios'

export function getLoginApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const body = data as {
        message?: unknown
        error?: { message?: unknown; code?: unknown }
      }
      const nested = body.error?.message
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim()
      }
      const message = body.message
      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim()
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
