import type {
  AccountEmailCheckResponse,
  PasswordResetConfirmResponse,
  PasswordResetEligibilityResponse,
} from './types'

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === false) {
    const error = root.error
    const nested =
      error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message.trim()
        : ''
    const message =
      nested || (typeof root.message === 'string' ? root.message.trim() : '') || '요청에 실패했습니다.'
    throw new Error(message)
  }
  if (root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function parseAccountEmailCheckResponse(payload: unknown): AccountEmailCheckResponse {
  const root = unwrapData(payload)
  if (!root) {
    return {}
  }

  return {
    exists: optionalBoolean(root.exists),
    available: optionalBoolean(root.available),
    message: optionalString(root.message),
    nextAction: optionalString(root.nextAction),
  }
}

/** eligible이 true로 확인될 때만 새 비밀번호 단계로 간다 — 값이 없으면 false */
export function parsePasswordResetEligibilityResponse(
  payload: unknown,
): PasswordResetEligibilityResponse {
  const root = unwrapData(payload)
  return {
    eligible: root?.eligible === true,
    message: optionalString(root?.message),
    nextAction: optionalString(root?.nextAction),
  }
}

export function parsePasswordResetConfirmResponse(
  payload: unknown,
): PasswordResetConfirmResponse {
  const root = unwrapData(payload)
  if (!root) {
    return {}
  }

  return {
    resetCompleted: optionalBoolean(root.resetCompleted),
  }
}
