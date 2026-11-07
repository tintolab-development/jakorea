/**
 * Homepage Admin API 에러 envelope에서 메시지·코드 추출
 * (axios response.data: `{ message?, error?: { code, message } }`)
 */

import type { ReactNode } from 'react'
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
  const record = data as { code?: unknown; error?: { code?: unknown } }
  const code = record.error?.code ?? record.code
  return typeof code === 'string' && code.trim() ? code.trim() : undefined
}

/** ApiErrorResponse.field — 검증 실패 필드명 */
export function readApiErrorField(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const record = data as { field?: unknown; error?: { field?: unknown } }
  const field = record.field ?? record.error?.field
  return typeof field === 'string' && field.trim() ? field.trim() : undefined
}

export function isOptimisticLockConflictError(error: unknown): boolean {
  const code = readApiErrorCode(error)
  if (code === 'OPTIMISTIC_LOCK_CONFLICT') return true
  const message = readApiErrorMessage(error) ?? ''
  return /changed by another administrator/i.test(message) || /optimistic.?lock/i.test(message)
}

export type AdminMutationAlert = { title: string; content: ReactNode }

const OPTIMISTIC_LOCK_ALERT: AdminMutationAlert = {
  title: '저장 실패',
  content: '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.',
}

const FORBIDDEN_ALERT: AdminMutationAlert = {
  title: '저장 실패',
  content: '저장 권한이 없습니다. 관리자에게 문의해 주세요.',
}

/** lock 충돌 · 권한 거부 — 도메인 알림보다 먼저 매핑 */
export function mapCommonRemoteMutationFailure(error: unknown): AdminMutationAlert | null {
  if (isOptimisticLockConflictError(error)) return OPTIMISTIC_LOCK_ALERT
  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  if (/FORBIDDEN/i.test(code) || /Permission is denied|FORBIDDEN/i.test(message)) {
    return FORBIDDEN_ALERT
  }
  return null
}

/** 히어로·띠배너·소셜 최소 1건 사용 유지 (remote 4xx envelope) */
export function isMinActiveRequiredError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : ''
  if (/MinActive/.test(name)) return true
  const code = readApiErrorCode(error) ?? ''
  if (/MIN_ACTIVE|LAST_ENABLED|AT_LEAST_ONE_ENABLED/i.test(code)) return true
  const message = readApiErrorMessage(error) ?? ''
  return /최소 1개 이상 사용/.test(message) || /at least one (active|enabled)/i.test(message)
}

/** 띠배너·팝업 동시 사용 상한 (remote 4xx envelope) */
export function isEnabledLimitError(error: unknown): boolean {
  const code = readApiErrorCode(error) ?? ''
  if (/MAX_ACTIVE|ENABLED_LIMIT|ACTIVE_LIMIT|TOO_MANY_ENABLED/i.test(code)) return true
  const message = readApiErrorMessage(error) ?? ''
  return (
    /동시 사용/.test(message) ||
    /max(imum)?[_\s-]?(active|enabled)/i.test(message) ||
    /too many (active|enabled)/i.test(message) ||
    /at most \d+/i.test(message)
  )
}

/** BE NotBlank / must not be blank — 공통 필수 미입력 안내로 매핑 */
export function isBlankRequiredValidationError(error: unknown): boolean {
  if (isMinActiveRequiredError(error) || isEnabledLimitError(error)) return false
  const localCode = error instanceof Error ? error.message : ''
  if (localCode === 'EMPTY_REQUIRED' || /_REQUIRED$/.test(localCode)) return true
  const code = readApiErrorCode(error) ?? ''
  if (/^(NOT_BLANK|BLANK_VALUE|FIELD_REQUIRED)$/i.test(code)) return true
  const message = readApiErrorMessage(error) ?? ''
  if (/must not be blank|must not be empty|must not be null/i.test(message)) return true
  if (/\bis required\.?$/i.test(message)) return true
  if (code === 'VALIDATION_ERROR' && /blank|not be empty/i.test(message)) return true
  return false
}
