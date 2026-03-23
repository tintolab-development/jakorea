/**
 * MFA 상태 관리 Hook
 * Phase 0.5.1: MFA/OTP UX
 */

import { useState, useCallback } from 'react'
import type { MfaState } from '@/types/mfa'
import { createTotpMfaState } from '@/data/mock/mfa'

interface UseMfaResult {
  /** MFA 상태 */
  mfaState: MfaState | null
  /** MFA 상태 설정 */
  setMfaState: (state: MfaState | null) => void
  /** MFA 초기화 (로그인 후 MFA 필요 시) */
  initializeMfa: (userId: string, accountLabel: string) => void
  /** MFA 완료 처리 */
  completeMfa: () => void
  /** MFA 리셋 */
  resetMfa: () => void
}

/**
 * MFA 상태 관리 Hook
 */
export function useMfa(): UseMfaResult {
  const [mfaState, setMfaState] = useState<MfaState | null>(null)

  const initializeMfa = useCallback((userId: string, accountLabel: string) => {
    const state = createTotpMfaState(userId, accountLabel)
    setMfaState(state)
  }, [])

  const completeMfa = useCallback(() => {
    if (mfaState) {
      setMfaState({
        ...mfaState,
        isVerified: true,
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
      })
    }
  }, [mfaState])

  const resetMfa = useCallback(() => {
    setMfaState(null)
  }, [])

  return {
    mfaState,
    setMfaState,
    initializeMfa,
    completeMfa,
    resetMfa,
  }
}
