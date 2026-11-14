import { isAxiosError } from 'axios'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'

/** 로그인 실패 누적으로 계정이 잠긴 경우 — Figma 로그인 프로세스 Alert(16909:166301) 문구 */
export const ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE = `계정이 일시적으로 잠겼습니다. 비밀번호를 찾거나 ${LOGIN_POLICY.lockoutDurationMinutes}분 후 다시 시도해 주세요.`

export class AdminLoginAccountLockedError extends Error {
  constructor(message = ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE) {
    super(message)
    this.name = 'AdminLoginAccountLockedError'
  }
}

const ADMIN_LOGIN_ACCOUNT_LOCKED_CODES = new Set([
  'ACCOUNT_LOCKED',
  'LOGIN_LOCKED',
  'ACCOUNT_TEMPORARILY_LOCKED',
  'TOO_MANY_LOGIN_ATTEMPTS',
])

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * 승인 대기와 같은 HTTP 423 으로 오므로 상태 코드만으로는 구분하지 않는다.
 * 코드(`error.code`·`code`)가 잠금이거나, 본문(`detail`·`message`)이 잠금을 알리면 잠금으로 본다.
 */
export function isAdminLoginAccountLockedResponse(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const body = payload as {
    code?: unknown
    detail?: unknown
    message?: unknown
    error?: { code?: unknown; message?: unknown; detail?: unknown }
  }
  const code = (readText(body.error?.code) || readText(body.code)).trim().toUpperCase()
  if (code && ADMIN_LOGIN_ACCOUNT_LOCKED_CODES.has(code)) return true

  const text = [body.detail, body.message, body.error?.message, body.error?.detail]
    .map(readText)
    .join(' ')
  return /잠겼|잠금|locked/i.test(text)
}

export function isAdminLoginAccountLockedError(error: unknown): boolean {
  if (error instanceof AdminLoginAccountLockedError) return true
  if (isAxiosError(error)) return isAdminLoginAccountLockedResponse(error.response?.data)
  if (error && typeof error === 'object' && 'name' in error && error.name === 'AdminLoginApiError') {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' && ADMIN_LOGIN_ACCOUNT_LOCKED_CODES.has(code.toUpperCase())
  }
  return false
}
