const STORAGE_KEY = 'platform_signup_guardian_bridge_v1'

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
}

export function readGuardianSignupBridgeState(): GuardianSignupBridgePersistedState | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GuardianSignupBridgePersistedState
    if (
      !parsed.signupIntentId?.trim() ||
      typeof parsed.guardianSessionId !== 'number' ||
      !parsed.guardianStatusToken?.trim()
    ) {
      return null
    }
    return parsed
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
