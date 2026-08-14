const FIND_PASSWORD_RECOVERY_STORAGE_KEY = 'platform:find-password-recovery'

export const FIND_PASSWORD_VERIFICATION_TTL_MS = 10 * 60 * 1000

export const MOCK_FIND_PASSWORD_NOT_FOUND_EMAIL = 'ja@gmail.com'

export type FindPasswordRecoveryState = {
  email: string
  identityVerificationSessionId: number
  profileToken: string
  expiresAt: number
}

function isRecoveryState(value: unknown): value is FindPasswordRecoveryState {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.email === 'string' &&
    o.email.trim().length > 0 &&
    typeof o.identityVerificationSessionId === 'number' &&
    Number.isFinite(o.identityVerificationSessionId) &&
    typeof o.profileToken === 'string' &&
    typeof o.expiresAt === 'number'
  )
}

export function setFindPasswordRecoveryState(state: FindPasswordRecoveryState) {
  window.sessionStorage.setItem(FIND_PASSWORD_RECOVERY_STORAGE_KEY, JSON.stringify(state))
}

export function clearFindPasswordRecoveryState() {
  window.sessionStorage.removeItem(FIND_PASSWORD_RECOVERY_STORAGE_KEY)
}

export function getFindPasswordRecoveryState(): FindPasswordRecoveryState | null {
  const raw = window.sessionStorage.getItem(FIND_PASSWORD_RECOVERY_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecoveryState(parsed)) {
      clearFindPasswordRecoveryState()
      return null
    }
    if (Date.now() >= parsed.expiresAt) {
      clearFindPasswordRecoveryState()
      return null
    }
    return parsed
  } catch {
    clearFindPasswordRecoveryState()
    return null
  }
}
