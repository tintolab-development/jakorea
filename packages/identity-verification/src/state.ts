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
  buildMockNiceUrl: (sessionId: number, nonce: string, name?: string) => string
  validatePendingState: (queryState: string | null) => boolean
  isIdentityMessage: (data: unknown) => data is IdentityMessage
}

export interface CreateIdentityVerificationStateOptions {
  routes: IdentityVerificationRoutes
  /** localStorage 키 prefix — 앱·플로우별로 분리 */
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
    name: `${prefix}_name`,
  }

  /**
   * NICE 콜백은 팝업 창에서 열리므로 `sessionStorage`(창별 격리) 대신
   * 동일 origin의 `localStorage`를 사용한다.
   */
  function setPendingChallenge(challenge: PendingIdentityChallenge) {
    localStorage.setItem(keys.sessionId, String(challenge.sessionId))
    localStorage.setItem(keys.nonce, challenge.nonce)
    if (challenge.birthDate) {
      localStorage.setItem(keys.birthDate, challenge.birthDate)
    } else {
      localStorage.removeItem(keys.birthDate)
    }
    if (challenge.gender) {
      localStorage.setItem(keys.gender, challenge.gender)
    } else {
      localStorage.removeItem(keys.gender)
    }
    if (challenge.name) {
      localStorage.setItem(keys.name, challenge.name)
    } else {
      localStorage.removeItem(keys.name)
    }
  }

  function getPendingChallenge(): PendingIdentityChallenge | null {
    const sessionIdRaw = localStorage.getItem(keys.sessionId)
    const nonce = localStorage.getItem(keys.nonce)

    if (!sessionIdRaw || !nonce) {
      return null
    }

    const sessionId = Number(sessionIdRaw)
    if (Number.isNaN(sessionId)) {
      return null
    }

    const birthDate = localStorage.getItem(keys.birthDate) ?? undefined
    const gender = localStorage.getItem(keys.gender) ?? undefined
    const name = localStorage.getItem(keys.name) ?? undefined

    return { sessionId, nonce, birthDate, gender, name }
  }

  function clearPendingChallenge() {
    localStorage.removeItem(keys.sessionId)
    localStorage.removeItem(keys.nonce)
    localStorage.removeItem(keys.birthDate)
    localStorage.removeItem(keys.gender)
    localStorage.removeItem(keys.name)
  }

  function buildCallbackUrl() {
    return `${window.location.origin}${options.routes.callbackPath}`
  }

  function buildMockNiceUrl(sessionId: number, nonce: string, name?: string) {
    const params = new URLSearchParams({
      sessionId: String(sessionId),
      nonce,
    })
    if (name?.trim()) {
      params.set('name', name.trim())
    }
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
