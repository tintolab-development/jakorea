import type {
  IdentityMessage,
  IdentityVerificationRoutes,
  PendingIdentityChallenge,
} from './types'

export interface IdentityVerificationState {
  setPendingChallenge: (challenge: PendingIdentityChallenge) => void
  getPendingChallenge: () => PendingIdentityChallenge | null
  clearPendingChallenge: () => void
  buildCallbackUrl: () => string
  buildMockNiceUrl: (sessionId: number, nonce: string) => string
  validatePendingState: (queryState: string | null) => boolean
  isIdentityMessage: (data: unknown) => data is IdentityMessage
}

export interface CreateIdentityVerificationStateOptions {
  routes: IdentityVerificationRoutes
  /** sessionStorage 키 prefix — 앱·플로우별로 분리 */
  storagePrefix?: string
}

const DEFAULT_PREFIX = 'identity_verification'

export function createIdentityVerificationState(
  options: CreateIdentityVerificationStateOptions
): IdentityVerificationState {
  const prefix = options.storagePrefix ?? DEFAULT_PREFIX
  const keys = {
    sessionId: `${prefix}_session_id`,
    nonce: `${prefix}_challenge_nonce`,
    birthDate: `${prefix}_birth_date`,
    gender: `${prefix}_gender`,
  }

  function setPendingChallenge(challenge: PendingIdentityChallenge) {
    sessionStorage.setItem(keys.sessionId, String(challenge.sessionId))
    sessionStorage.setItem(keys.nonce, challenge.nonce)
    sessionStorage.setItem(keys.birthDate, challenge.birthDate)
    sessionStorage.setItem(keys.gender, challenge.gender)
  }

  function getPendingChallenge(): PendingIdentityChallenge | null {
    const sessionIdRaw = sessionStorage.getItem(keys.sessionId)
    const nonce = sessionStorage.getItem(keys.nonce)
    const birthDate = sessionStorage.getItem(keys.birthDate)
    const gender = sessionStorage.getItem(keys.gender)

    if (!sessionIdRaw || !nonce || !birthDate || !gender) {
      return null
    }

    const sessionId = Number(sessionIdRaw)
    if (Number.isNaN(sessionId)) {
      return null
    }

    return { sessionId, nonce, birthDate, gender }
  }

  function clearPendingChallenge() {
    sessionStorage.removeItem(keys.sessionId)
    sessionStorage.removeItem(keys.nonce)
    sessionStorage.removeItem(keys.birthDate)
    sessionStorage.removeItem(keys.gender)
  }

  function buildCallbackUrl() {
    return `${window.location.origin}${options.routes.callbackPath}`
  }

  function buildMockNiceUrl(sessionId: number, nonce: string) {
    const params = new URLSearchParams({
      sessionId: String(sessionId),
      nonce,
    })
    return `${window.location.origin}${options.routes.mockPath}?${params.toString()}`
  }

  function validatePendingState(queryState: string | null) {
    if (!queryState) {
      return true
    }
    const pending = getPendingChallenge()
    if (!pending) {
      return false
    }
    return pending.nonce === queryState
  }

  function isIdentityMessage(data: unknown): data is IdentityMessage {
    if (!data || typeof data !== 'object' || !('type' in data)) {
      return false
    }
    const type = (data as { type: unknown }).type
    return type === 'IDENTITY_VERIFIED' || type === 'IDENTITY_FAILED' || type === 'IDENTITY_CANCELLED'
  }

  return {
    setPendingChallenge,
    getPendingChallenge,
    clearPendingChallenge,
    buildCallbackUrl,
    buildMockNiceUrl,
    validatePendingState,
    isIdentityMessage,
  }
}
