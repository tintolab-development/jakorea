import type { FormInstance } from 'antd'
import { isAxiosError } from 'axios'

import { AdminLoginApiError } from '@/features/auth/api/admin-login-fetcher'
import { extractAdminLoginErrorCode } from '@/features/auth/errors/admin-login-approval-pending-error'

export const LOGIN_EMAIL_NOT_FOUND_MESSAGE =
  '가입한 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'

export const LOGIN_PASSWORD_MISMATCH_MESSAGE =
  '비밀번호가 일치하지 않습니다. 다시 한 번 확인해 주세요.'

type LoginFieldName = 'email' | 'password'
type LoginFieldErrorTarget = LoginFieldName | 'both'

const EMAIL_NOT_FOUND_CODES = new Set([
  'EMAIL_NOT_FOUND',
  'USER_NOT_FOUND',
  'ACCOUNT_NOT_FOUND',
  'ADMIN_NOT_FOUND',
])

const PASSWORD_MISMATCH_CODES = new Set([
  'INVALID_PASSWORD',
  'WRONG_PASSWORD',
  'PASSWORD_MISMATCH',
])

function extractLoginErrorField(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    const payload = error.response?.data
    if (payload && typeof payload === 'object') {
      const body = payload as { field?: unknown; error?: { field?: unknown } }
      const nested = body.error?.field
      if (typeof nested === 'string' && nested.trim()) return nested.trim()
      if (typeof body.field === 'string' && body.field.trim()) return body.field.trim()
    }
  }

  if (error instanceof AdminLoginApiError) {
    if (typeof error.field === 'string' && error.field.trim()) {
      return error.field.trim()
    }
  }

  return undefined
}

function resolveLoginFieldErrorTarget(error?: unknown): LoginFieldErrorTarget {
  const field = extractLoginErrorField(error)?.toLowerCase()
  if (field === 'email') return 'email'
  if (field === 'password') return 'password'

  const code = error ? extractAdminLoginErrorCode(getLoginErrorPayload(error)) : undefined
  if (code && EMAIL_NOT_FOUND_CODES.has(code.toUpperCase())) return 'email'
  if (code && PASSWORD_MISMATCH_CODES.has(code.toUpperCase())) return 'password'

  return 'both'
}

function getLoginErrorPayload(error: unknown): unknown {
  if (isAxiosError(error)) return error.response?.data
  if (error instanceof AdminLoginApiError) {
    return { code: error.code }
  }
  return undefined
}

/** 입력 검증 실패(400 `VALIDATION_FAILED`) — 서버 `message`를 그대로 쓴다 (QA-0478) */
function resolveLoginValidationMessage(error: unknown): string | undefined {
  const code = error ? extractAdminLoginErrorCode(getLoginErrorPayload(error)) : undefined
  if (code?.toUpperCase() !== 'VALIDATION_FAILED') return undefined
  if (error instanceof AdminLoginApiError) {
    return error.message.trim() || undefined
  }
  if (isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: unknown; error?: { message?: unknown } }
      | undefined
    const message = payload?.error?.message ?? payload?.message
    return typeof message === 'string' && message.trim() ? message.trim() : undefined
  }
  return undefined
}

export function applyLoginFieldErrors(form: FormInstance, error?: unknown): void {
  const validationMessage = resolveLoginValidationMessage(error)
  if (validationMessage) {
    const field = extractLoginErrorField(error)?.toLowerCase()
    form.setFields([
      { name: field === 'email' ? 'email' : 'password', errors: [validationMessage] },
    ])
    return
  }

  const target = resolveLoginFieldErrorTarget(error)
  const fields: Array<{ name: LoginFieldName; errors: string[] }> = []

  if (target === 'email' || target === 'both') {
    fields.push({ name: 'email', errors: [LOGIN_EMAIL_NOT_FOUND_MESSAGE] })
  }
  if (target === 'password' || target === 'both') {
    fields.push({ name: 'password', errors: [LOGIN_PASSWORD_MISMATCH_MESSAGE] })
  }

  form.setFields(fields)
}

export function clearLoginFieldErrors(form: FormInstance): void {
  form.setFields([
    { name: 'email', errors: [] },
    { name: 'password', errors: [] },
  ])
}
