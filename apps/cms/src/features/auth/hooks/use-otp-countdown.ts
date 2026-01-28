/**
 * OTP 카운트다운 Hook
 * Phase 0.5.1: MFA/OTP UX
 */

import { useState, useEffect, useCallback } from 'react'
import { OTP_POLICY } from '@/shared/constants/mfa-policy'

interface UseOtpCountdownResult {
  /** 남은 시간 (초) */
  remainingSeconds: number
  /** 유효시간 만료 여부 */
  isExpired: boolean
  /** 재전송 가능 여부 */
  canResend: boolean
  /** 재전송까지 남은 시간 (초) */
  resendCooldownSeconds: number
  /** 카운트다운 시작 */
  start: (durationSeconds?: number) => void
  /** 카운트다운 리셋 */
  reset: () => void
}

/**
 * OTP 카운트다운 Hook
 * @param initialSeconds 초기 시간 (기본값: OTP_POLICY.validitySeconds)
 */
export function useOtpCountdown(initialSeconds: number = OTP_POLICY.validitySeconds): UseOtpCountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!isActive || remainingSeconds <= 0) {
      return
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, remainingSeconds])

  const start = useCallback((durationSeconds: number = initialSeconds) => {
    setRemainingSeconds(durationSeconds)
    setIsActive(true)
  }, [initialSeconds])

  const reset = useCallback(() => {
    setRemainingSeconds(initialSeconds)
    setIsActive(false)
  }, [initialSeconds])

  const isExpired = remainingSeconds === 0
  const resendCooldownSeconds = Math.max(0, remainingSeconds - (OTP_POLICY.validitySeconds - OTP_POLICY.resendCooldownSeconds))
  const canResend = resendCooldownSeconds === 0

  return {
    remainingSeconds,
    isExpired,
    canResend,
    resendCooldownSeconds,
    start,
    reset,
  }
}
