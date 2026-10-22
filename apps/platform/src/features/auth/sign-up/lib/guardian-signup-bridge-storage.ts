const STORAGE_KEY = 'platform_signup_guardian_bridge_v1'

export const GUARDIAN_IDENTITY_COMPLETION_PREFIX = 'platform_guardian_identity'

export type GuardianSignupBridgePersistedState = {
  signupIntentId: string
  intentExpiresAt?: string
  guardianSessionId: number
  guardianStatusToken: string
  guardianExpiresAt?: string
  identitySessionId?: number
  guardianConsentVersion?: string
  guardianRelation?: string
  niceChallengeNonce?: string
  finalConsentToken?: string
  finalConsentExpiresAt?: string
  finalConsentIdempotencyKey?: string
  /** 보호자 NICE + 최종 동의까지 끝난 뒤 true. 가입 완료 직전 메모리 플래그 대신 복원 */
  finalConsentCompleted?: boolean
}

function toGuardianSessionId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

export function readGuardianSignupBridgeState(): GuardianSignupBridgePersistedState | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuardianSignupBridgePersistedState
    const guardianSessionId = toGuardianSessionId(parsed.guardianSessionId)
    if (
      !parsed.signupIntentId?.trim() ||
      guardianSessionId == null ||
      !parsed.guardianStatusToken?.trim()
    ) {
      return null
    }
    return {
      ...parsed,
      guardianSessionId,
    }
  } catch {
    return null
  }
}

export function writeGuardianSignupBridgeState(
  patch: Partial<GuardianSignupBridgePersistedState> &
    Pick<
      GuardianSignupBridgePersistedState,
      'signupIntentId' | 'guardianSessionId' | 'guardianStatusToken'
    >,
) {
  if (typeof sessionStorage === 'undefined') return
  const prev = readGuardianSignupBridgeState()
  const next: GuardianSignupBridgePersistedState = {
    ...(prev ?? {
      signupIntentId: patch.signupIntentId,
      guardianSessionId: patch.guardianSessionId,
      guardianStatusToken: patch.guardianStatusToken,
    }),
    ...patch,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearGuardianSignupBridgeState() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function setGuardianBridgePendingIdentitySession(input: {
  identitySessionId: number
  nonce: string
}) {
  const prev = readGuardianSignupBridgeState()
  if (!prev) return
  writeGuardianSignupBridgeState({
    ...prev,
    identitySessionId: input.identitySessionId,
    niceChallengeNonce: input.nonce,
  })
}

export function getGuardianBridgePendingIdentitySession(): {
  identitySessionId: number
  nonce: string
} | null {
  const state = readGuardianSignupBridgeState()
  if (!state?.identitySessionId || !state.niceChallengeNonce?.trim()) {
    return null
  }
  return {
    identitySessionId: state.identitySessionId,
    nonce: state.niceChallengeNonce.trim(),
  }
}

export type GuardianFinalConsentChallengeState = {
  token: string
  idempotencyKey: string
  expiresAt?: string
}

export function readGuardianFinalConsentChallenge(
  nowMs: number = Date.now(),
): GuardianFinalConsentChallengeState | null {
  const state = readGuardianSignupBridgeState()
  const token = state?.finalConsentToken?.trim()
  const idempotencyKey = state?.finalConsentIdempotencyKey?.trim()
  if (!state || !token || !idempotencyKey) return null

  const expiresAt = state.finalConsentExpiresAt?.trim()
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt)
    if (Number.isFinite(expiresMs) && expiresMs <= nowMs) {
      return null
    }
  }

  return { token, idempotencyKey, expiresAt: expiresAt || undefined }
}

export function writeGuardianFinalConsentChallenge(input: GuardianFinalConsentChallengeState) {
  const prev = readGuardianSignupBridgeState()
  if (!prev) return
  writeGuardianSignupBridgeState({
    ...prev,
    finalConsentToken: input.token,
    finalConsentIdempotencyKey: input.idempotencyKey,
    finalConsentExpiresAt: input.expiresAt,
  })
}
