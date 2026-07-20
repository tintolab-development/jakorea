/**
 * OTP 검증 Hook
 * Phase 0.5.1: MFA/OTP UX
 */

import { useState, useCallback } from 'react'
import { sendOtp, verifyOtp, verifyTotp } from '@/entities/user/api/mfa-service'
import { OTP_POLICY, OTP_LENGTH } from '@/shared/constants/mfa-policy'
import type { OtpSendRequest, OtpVerifyRequest, TotpVerifyRequest } from '@/types/mfa'

interface UseOtpVerificationResult {
  /** OTP 발송 중 여부 */
  sending: boolean
  /** OTP 검증 중 여부 */
  verifying: boolean
  /** 실패 횟수 */
  failedAttempts: number
  /** 잠금 여부 */
  isLocked: boolean
  /** 잠금 해제 시간 */
  lockUntil: string | null
  /** OTP 발송 */
  sendOtpCode: (request: OtpSendRequest) => Promise<void>
  /** OTP 검증 (SMS Mock) */
  verifyOtpCode: (request: OtpVerifyRequest) => Promise<boolean>
  /** TOTP 검증 (Microsoft Authenticator 등) */
  verifyTotpCode: (request: TotpVerifyRequest) => Promise<boolean>
  /** 상태 리셋 */
  reset: () => void
}

/**
 * OTP 검증 Hook
 */
export function useOtpVerification(): UseOtpVerificationResult {
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockUntil, setLockUntil] = useState<string | null>(null)

  const sendOtpCode = useCallback(async (request: OtpSendRequest) => {
    setSending(true)
    try {
      await sendOtp(request)
      setFailedAttempts(0) // 발송 시 실패 횟수 리셋
      setIsLocked(false)
      setLockUntil(null)
    } catch (error) {
      console.error('OTP 발송 실패:', error)
      throw error
    } finally {
      setSending(false)
    }
  }, [])

  const verifyOtpCode = useCallback(async (request: OtpVerifyRequest): Promise<boolean> => {
    setVerifying(true)

    // 입력값 검증: 길이 확인
    if (!request.otpCode || request.otpCode.length !== OTP_LENGTH) {
      setVerifying(false)
      throw new Error(`인증번호는 ${OTP_LENGTH}자리입니다.`)
    }

    // 입력값 검증: 숫자만 허용
    if (!/^\d+$/.test(request.otpCode)) {
      setVerifying(false)
      throw new Error('인증번호는 숫자만 입력 가능합니다.')
    }

    // 잠금 확인
    if (isLocked && lockUntil) {
      const lockTime = new Date(lockUntil)
      if (lockTime > new Date()) {
        setVerifying(false)
        throw new Error(`인증 시도 횟수를 초과했습니다. ${Math.ceil((lockTime.getTime() - Date.now()) / 60000)}분 후 다시 시도해주세요.`)
      }
      // 잠금 시간이 지났으면 잠금 해제
      setIsLocked(false)
      setLockUntil(null)
      setFailedAttempts(0)
    }

    try {
      const response = await verifyOtp(request)

      if (response.verified) {
        // 성공 시 상태 리셋
        setFailedAttempts(0)
        setIsLocked(false)
        setLockUntil(null)
        return true
      }

      // 실패 시 실패 횟수 증가
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      // 최대 실패 횟수 초과 시 잠금
      if (newFailedAttempts >= OTP_POLICY.maxFailedAttempts) {
        const lockTime = new Date(Date.now() + OTP_POLICY.lockoutDurationMinutes * 60 * 1000)
        setIsLocked(true)
        setLockUntil(lockTime.toISOString())
        throw new Error(`인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`)
      }

      return false
    } catch (error) {
      console.error('OTP 검증 실패:', error)
      throw error
    } finally {
      setVerifying(false)
    }
  }, [failedAttempts, isLocked, lockUntil])

  const verifyTotpCode = useCallback(async (request: TotpVerifyRequest): Promise<boolean> => {
    setVerifying(true)

    if (!request.otpCode || request.otpCode.length !== OTP_LENGTH) {
      setVerifying(false)
      throw new Error(`인증번호는 ${OTP_LENGTH}자리입니다.`)
    }

    if (!/^\d+$/.test(request.otpCode)) {
      setVerifying(false)
      throw new Error('인증번호는 숫자만 입력 가능합니다.')
    }

    if (isLocked && lockUntil) {
      const lockTime = new Date(lockUntil)
      if (lockTime > new Date()) {
        setVerifying(false)
        throw new Error(
          `인증 시도 횟수를 초과했습니다. ${Math.ceil((lockTime.getTime() - Date.now()) / 60000)}분 후 다시 시도해주세요.`
        )
      }
      setIsLocked(false)
      setLockUntil(null)
      setFailedAttempts(0)
    }

    try {
      const response = await verifyTotp(request.email, request.otpCode, {
        challengeUuid: request.challengeUuid,
      })

      if (response.verified) {
        setFailedAttempts(0)
        setIsLocked(false)
        setLockUntil(null)
        return true
      }

      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      if (newFailedAttempts >= OTP_POLICY.maxFailedAttempts) {
        const lockTime = new Date(Date.now() + OTP_POLICY.lockoutDurationMinutes * 60 * 1000)
        setIsLocked(true)
        setLockUntil(lockTime.toISOString())
        throw new Error(
          `인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`
        )
      }

      return false
    } catch (error) {
      console.error('TOTP 검증 실패:', error)
      throw error
    } finally {
      setVerifying(false)
    }
  }, [failedAttempts, isLocked, lockUntil])

  const reset = useCallback(() => {
    setFailedAttempts(0)
    setIsLocked(false)
    setLockUntil(null)
  }, [])

  return {
    sending,
    verifying,
    failedAttempts,
    isLocked,
    lockUntil,
    sendOtpCode,
    verifyOtpCode,
    verifyTotpCode,
    reset,
  }
}
