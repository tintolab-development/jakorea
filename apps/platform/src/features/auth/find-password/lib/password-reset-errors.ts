import { isAxiosError } from 'axios'

/**
 * 비밀번호 재설정(`/password-reset/confirm`, `/eligibility`) 오류 코드별 이동.
 * 분기는 `error.code`로만 하고 문구는 서버 message를 쓴다. 해당 코드가 아니면 null(기존 처리).
 */
export type PasswordResetErrorResolution =
  /** 이메일 입력 단계로 돌아가 이메일 칸에 표시 */
  | { kind: 'email'; message: string }
  /** 새 비밀번호 확인 칸에 표시 */
  | { kind: 'confirm'; message: string }
  /** 본인인증부터 다시 (비밀번호 찾기 첫 단계) */
  | { kind: 'restart-identity'; message: string }

export const PASSWORD_RESET_ACCOUNT_MISMATCH = 'PASSWORD_RESET_ACCOUNT_MISMATCH'
export const PASSWORD_RESET_CONFIRM_MISMATCH = 'PASSWORD_RESET_CONFIRM_MISMATCH'
export const IDENTITY_VERIFICATION_SESSION_REQUIRED = 'IDENTITY_VERIFICATION_SESSION_REQUIRED'

function readError(error: unknown): { code: string; message: string } | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const nested = (data as { error?: { code?: unknown; message?: unknown } }).error
  const code = typeof nested?.code === 'string' ? nested.code.trim().toUpperCase() : ''
  const message = typeof nested?.message === 'string' ? nested.message.trim() : ''
  return code ? { code, message } : null
}

export function resolvePasswordResetApiError(
  error: unknown,
): PasswordResetErrorResolution | null {
  const detail = readError(error)
  if (!detail?.message) return null
  switch (detail.code) {
    case PASSWORD_RESET_ACCOUNT_MISMATCH:
      return { kind: 'email', message: detail.message }
    case PASSWORD_RESET_CONFIRM_MISMATCH:
      return { kind: 'confirm', message: detail.message }
    case IDENTITY_VERIFICATION_SESSION_REQUIRED:
      return { kind: 'restart-identity', message: detail.message }
    default:
      return null
  }
}

/** 새 비밀번호 단계 → 비밀번호 찾기 첫 단계로 돌아갈 때 넘기는 라우터 state (이메일 등 개인정보는 넣지 않는다) */
export type FindPasswordReturnState = {
  findPasswordError?: { field: 'email' | 'identity'; message: string }
}

export function readFindPasswordReturnState(
  state: unknown,
): FindPasswordReturnState['findPasswordError'] | null {
  if (!state || typeof state !== 'object') return null
  const value = (state as FindPasswordReturnState).findPasswordError
  if (!value || typeof value.message !== 'string' || !value.message.trim()) return null
  if (value.field !== 'email' && value.field !== 'identity') return null
  return { field: value.field, message: value.message.trim() }
}
