import type { GuardianSignupStatusResponse } from '../../api/guardian-signup-bridge/types.ts'

export type GuardianBridgeStatusKind =
  | 'consented'
  | 'needs_final_consent'
  | 'needs_nice'
  | 'expired'
  | 'unknown'

function normalizeStatus(status: string | undefined) {
  return status?.trim().toUpperCase() ?? ''
}

export function classifyGuardianSignupStatus(
  status: Pick<GuardianSignupStatusResponse, 'status' | 'identityVerified' | 'expiresAt'> | null | undefined,
  nowMs: number = Date.now(),
): GuardianBridgeStatusKind {
  if (!status) return 'unknown'

  const expiresAt = status.expiresAt?.trim()
  if (expiresAt) {
    const expiresMs = Date.parse(expiresAt)
    if (Number.isFinite(expiresMs) && expiresMs <= nowMs) {
      return 'expired'
    }
  }

  const normalized = normalizeStatus(status.status)
  if (normalized === 'CONSENTED') {
    return 'consented'
  }

  if (status.identityVerified === true && (normalized === 'PENDING' || normalized === '')) {
    return 'needs_final_consent'
  }

  if (status.identityVerified !== true) {
    return 'needs_nice'
  }

  return 'unknown'
}

export function shouldSkipGuardianNiceStart(
  status: Pick<GuardianSignupStatusResponse, 'status' | 'identityVerified' | 'expiresAt'> | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  const kind = classifyGuardianSignupStatus(status, nowMs)
  return kind === 'consented' || kind === 'needs_final_consent'
}

export function createGuardianNiceIdempotencyKey(guardianSessionId: number) {
  return `guardian-nice-${guardianSessionId}`
}
