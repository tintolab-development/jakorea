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
    const apiError = error as AdminLoginApiError & { field?: string }
    if (typeof apiError.field === 'string' && apiError.field.trim()) {
      return apiError.field.trim()
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

export function applyLoginFieldErrors(form: FormInstance, error?: unknown): void {
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
