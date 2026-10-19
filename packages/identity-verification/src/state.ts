import {
  clearIdentityCompletion,
  publishIdentityCompletion,
  subscribeIdentityCompletion,
  takeIdentityCompletion,
} from './completion-channel'
import type {
  IdentityMessage,
  IdentityVerificationRoutes,
  PendingIdentityChallenge,
} from './types'

export interface IdentityVerificationState {
  readonly storagePrefix: string
  setPendingChallenge: (challenge: PendingIdentityChallenge) => void
  getPendingChallenge: () => PendingIdentityChallenge | null
  clearPendingChallenge: () => void
  buildCallbackUrl: () => string
  buildMockNiceUrl: (sessionId: number, nonce: string, name?: string) => string
  buildResumePath: () => string
  validatePendingState: (queryState: string | null) => boolean
  isIdentityMessage: (data: unknown) => data is IdentityMessage
  publishCompletion: (message: IdentityMessage) => void
  takeCompletion: () => IdentityMessage | null
  clearCompletion: () => void
  subscribeCompletion: (handler: (message: IdentityMessage) => void) => () => void
}

export interface CreateIdentityVerificationStateOptions {
  routes: IdentityVerificationRoutes
  /** localStorage 키 prefix — 앱·플로우별로 분리 */
  storagePrefix?: string
  /**
   * 콜백·mock URL origin.
   * 미지정 시 `window.location.origin`.
   * 백엔드 NICE frontendReturnUrl allowlist와 맞추려면 `VITE_OAUTH_REDIRECT_ORIGIN` 등을 넘긴다.
   */
  publicOrigin?: () => string
}

const DEFAULT_PREFIX = 'identity_verification'

export function createIdentityVerificationState(
  options: CreateIdentityVerificationStateOptions
): IdentityVerificationState {
  const prefix = options.storagePrefix ?? DEFAULT_PREFIX
  const keys = {
    sessionId: `${prefix}_session_id`,
    nonce: `${prefix}_challenge_nonce`,
    statusToken: `${prefix}_status_token`,
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
    if (challenge.statusToken) {
      localStorage.setItem(keys.statusToken, challenge.statusToken)
    } else {
      localStorage.removeItem(keys.statusToken)
    }
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

    const statusToken = localStorage.getItem(keys.statusToken) ?? undefined
    const birthDate = localStorage.getItem(keys.birthDate) ?? undefined
    const gender = localStorage.getItem(keys.gender) ?? undefined
    const name = localStorage.getItem(keys.name) ?? undefined

    return { sessionId, nonce, statusToken, birthDate, gender, name }
  }

  function clearPendingChallenge() {
    localStorage.removeItem(keys.sessionId)
    localStorage.removeItem(keys.nonce)
    localStorage.removeItem(keys.statusToken)
    localStorage.removeItem(keys.birthDate)
    localStorage.removeItem(keys.gender)
    localStorage.removeItem(keys.name)
  }

  function buildCallbackUrl() {
    const origin = options.publicOrigin?.() || window.location.origin
    return `${origin}${options.routes.callbackPath}`
  }

  function buildResumePath() {
    if (options.routes.resumePath) {
      return options.routes.resumePath
    }
    return (
      options.routes.callbackPath.replace(
        /\/(?:[a-z0-9-]*-)?identity\/callback\/?$/i,
        ''
      ) || '/'
    )
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
      // 팝업 닫힘 레이스로 pending이 먼저 지워져도 콜백 쿼리의 sessionId·profileToken으로 완료한다.
      return true
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
    storagePrefix: prefix,
    setPendingChallenge,
    getPendingChallenge,
    clearPendingChallenge,
    buildCallbackUrl,
    buildMockNiceUrl,
    buildResumePath,
    validatePendingState,
    isIdentityMessage,
    publishCompletion: message => publishIdentityCompletion(prefix, message),
    takeCompletion: () => takeIdentityCompletion(prefix),
    clearCompletion: () => clearIdentityCompletion(prefix),
    subscribeCompletion: handler => subscribeIdentityCompletion(prefix, handler),
  }
}
