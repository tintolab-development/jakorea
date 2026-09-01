/**
 * Homepage Admin API 에러 envelope에서 메시지·코드 추출
 * (axios response.data: `{ message?, error?: { code, message } }`)
 */

import axios from 'axios'

export function readApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) return error.message
    return undefined
  }
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const record = data as {
    message?: unknown
    error?: { message?: unknown; code?: unknown }
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message.trim()
  }
  if (record.error && typeof record.error.message === 'string' && record.error.message.trim()) {
    return record.error.message.trim()
  }
  return undefined
}

export function readApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const code = (data as { error?: { code?: unknown } }).error?.code
  return typeof code === 'string' && code.trim() ? code.trim() : undefined
}

export function isOptimisticLockConflictError(error: unknown): boolean {
  const code = readApiErrorCode(error)
  if (code === 'OPTIMISTIC_LOCK_CONFLICT') return true
  const message = readApiErrorMessage(error) ?? ''
  return /changed by another administrator/i.test(message) || /optimistic.?lock/i.test(message)
}
