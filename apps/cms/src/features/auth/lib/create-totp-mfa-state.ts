import type { MfaState } from '@/types/mfa'

export function createTotpMfaState(_userId: string, accountLabel: string): MfaState {
  return {
    method: 'totp',
    isRequired: true,
    isVerified: false,
    accountLabel,
    lastSentAt: null,
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
  }
}
