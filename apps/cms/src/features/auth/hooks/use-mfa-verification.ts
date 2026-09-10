/**
 * MFA 인증 모달 로직 Hook
 * Phase 0.5.1: MFA/OTP UX — TOTP (Microsoft Authenticator)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Form } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { getTotpProvisioning, verifyTotp } from '@/entities/user/api/mfa-service'
import { OTP_LENGTH, OTP_POLICY, clampMfaFailedAttempts, isAdminLocalTestMfa } from '@/shared/constants/mfa-policy'
import { unknownErrorText } from '@/shared/utils/error-handler'
import type { TotpProvisioning } from '@/types/mfa'

interface UseMfaVerificationOptions {
  open: boolean
}

interface UseMfaVerificationResult {
  form: FormInstance
  otpCode: string
  setOtpCode: (value: string) => void
  mfaState: ReturnType<typeof useAuthStore.getState>['mfaState']
  provisioning: TotpProvisioning | null
  provisioningLoading: boolean
  provisioningError: string | null
  isLocalTestMfa: boolean
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
  verifying: boolean
  handleVerify: (values?: { otpCode?: string }) => Promise<void>
  /** OTP 입력 변경 — 6자리 완성 시 자동 검증 */
  onOtpCodeChange: (value: string) => void
  refreshProvisioning: () => Promise<void>
  lockMessage: string | null
  /** OTP 입력 초기화 시 증가 — 첫 칸 포커스용 */
  otpResetToken: number
}

export function useMfaVerification({
  open,
}: UseMfaVerificationOptions): UseMfaVerificationResult {
  const { user, mfaState, setMfaVerified, completeAdminAuth } = useAuthStore()
  const { verifying, failedAttempts, isLocked, lockUntil, verifyTotpCode, reset: resetVerification } =
    useOtpVerification()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  const [provisioning, setProvisioning] = useState<TotpProvisioning | null>(null)
  const [provisioningLoading, setProvisioningLoading] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)
  const [remoteVerifying, setRemoteVerifying] = useState(false)
  const [remoteFailedAttempts, setRemoteFailedAttempts] = useState(0)
  const [remoteIsLocked, setRemoteIsLocked] = useState(false)
  const [remoteLockUntil, setRemoteLockUntil] = useState<string | null>(null)
  const [otpResetToken, setOtpResetToken] = useState(0)
  const verifyInFlightRef = useRef(false)
  const remoteFailedAttemptsRef = useRef(0)
  const isBusy = verifying || remoteVerifying

  const isRemoteMfa = Boolean(mfaState?.challengeUuid)
  const isLocalTestMfa =
    isRemoteMfa &&
    isAdminLocalTestMfa(mfaState?.mfaMethod) &&
    !provisioning &&
    !provisioningLoading
  const displayFailedAttempts = isRemoteMfa ? remoteFailedAttempts : failedAttempts
  const displayIsLocked = isRemoteMfa ? remoteIsLocked : isLocked
  const displayLockUntil = isRemoteMfa ? remoteLockUntil : lockUntil

  const clearOtpInput = useCallback(() => {
    try {
      form.setFields([{ name: 'otpCode', errors: [] }])
      form.setFieldsValue({ otpCode: '' })
    } catch {
      console.debug('Form not connected, skipping clearOtpInput')
    }
    setOtpCode('')
    setOtpResetToken(token => token + 1)
  }, [form])

  const resetRemoteLockState = useCallback(() => {
    remoteFailedAttemptsRef.current = 0
    setRemoteFailedAttempts(0)
    setRemoteIsLocked(false)
    setRemoteLockUntil(null)
  }, [])

  const applyRemoteAccountLock = useCallback(() => {
    remoteFailedAttemptsRef.current = OTP_POLICY.maxFailedAttempts
    setRemoteFailedAttempts(OTP_POLICY.maxFailedAttempts)
    const lockTime = new Date(Date.now() + OTP_POLICY.lockoutDurationMinutes * 60 * 1000)
    setRemoteIsLocked(true)
    setRemoteLockUntil(lockTime.toISOString())
  }, [])

  /** 원격 MFA 실패 기록. 6회째(max) 도달 시 잠금. UI는 6 초과 표시 금지. */
  const registerRemoteFailure = useCallback(() => {
    if (remoteIsLocked) {
      clearOtpInput()
      return
    }
    const next = clampMfaFailedAttempts(remoteFailedAttemptsRef.current + 1)
    remoteFailedAttemptsRef.current = next
    setRemoteFailedAttempts(next)
    if (next >= OTP_POLICY.maxFailedAttempts) {
      applyRemoteAccountLock()
    }
    clearOtpInput()
  }, [clearOtpInput, remoteIsLocked, applyRemoteAccountLock])

  const ensureRemoteNotLocked = useCallback((): boolean => {
    if (!remoteIsLocked || !remoteLockUntil) return true
    const lockTime = new Date(remoteLockUntil)
    if (lockTime > new Date()) {
      clearOtpInput()
      return false
    }
    resetRemoteLockState()
    return true
  }, [remoteIsLocked, remoteLockUntil, clearOtpInput, resetRemoteLockState])

  const refreshProvisioning = useCallback(async () => {
    if (!user?.email) return

    setProvisioningLoading(true)
    setProvisioningError(null)
    try {
      const p = await getTotpProvisioning(user.email, {
        challengeUuid: mfaState?.challengeUuid,
        mfaMethod: mfaState?.mfaMethod,
        totpSecret: mfaState?.totpSecret,
        otpauthUri: mfaState?.otpauthUri,
        qrDataUrl: mfaState?.qrDataUrl,
      })
      setProvisioning(p)
    } catch (e: unknown) {
      const err = unknownErrorText(e, 'QR 정보를 불러오지 못했습니다.')
      setProvisioningError(err)
      setProvisioning(null)
    } finally {
      setProvisioningLoading(false)
    }
  }, [
    user?.email,
    mfaState?.challengeUuid,
    mfaState?.mfaMethod,
    mfaState?.totpSecret,
    mfaState?.otpauthUri,
    mfaState?.qrDataUrl,
  ])

  useEffect(() => {
    if (open && user?.email) {
      void refreshProvisioning()
    }
    if (!open) {
      setProvisioning(null)
      setProvisioningError(null)
      resetRemoteLockState()
    }
  }, [open, user?.email, refreshProvisioning, resetRemoteLockState])

  useEffect(() => {
    if (!open) {
      setOtpCode('')
      resetVerification()
      const frameId = requestAnimationFrame(() => {
        if (!open) {
          try {
            if (form && typeof form.resetFields === 'function') {
              try {
                form.getFieldsValue()
                form.resetFields()
              } catch {
                console.debug('Form not connected, skipping resetFields')
              }
            }
          } catch {
            console.debug('Form not connected, skipping resetFields')
          }
        }
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [open, form, resetVerification])

  const verifyAndComplete = useCallback(
    async (codeToVerify: string) => {
      if (verifyInFlightRef.current) return
      if (displayIsLocked) {
        clearOtpInput()
        return
      }
      verifyInFlightRef.current = true
      try {
        if (!user?.email) {
          return
        }

        if (codeToVerify.length !== OTP_LENGTH) {
          try {
            form.setFields([
              { name: 'otpCode', errors: [`인증번호는 ${OTP_LENGTH}자리입니다.`] },
            ])
          } catch {
            console.debug('Form not connected, skipping setFields (otp length)')
          }
          return
        }

        if (!/^\d+$/.test(codeToVerify)) {
          try {
            form.setFields([{ name: 'otpCode', errors: ['인증번호는 숫자만 입력 가능합니다.'] }])
          } catch {
            console.debug('Form not connected, skipping setFields (otp digits)')
          }
          return
        }

        try {
          if (isRemoteMfa && mfaState?.challengeUuid) {
            if (!ensureRemoteNotLocked()) {
              return
            }

            setRemoteVerifying(true)
            try {
              const response = await verifyTotp(user.email, codeToVerify, {
                challengeUuid: mfaState.challengeUuid,
              })

              if (response.verified && response.tokens) {
                resetRemoteLockState()
                completeAdminAuth(response.tokens)
                try {
                  form.resetFields()
                } catch {
                  console.debug('Form not connected, skipping resetFields')
                }
                setOtpCode('')
                return
              }

              // BE ACCOUNT_LOCKED(6회째): 입력 중단·횟수 증가 UI 중단
              if (response.isLocked || response.errorCode === 'ACCOUNT_LOCKED') {
                applyRemoteAccountLock()
                clearOtpInput()
                return
              }

              // MFA_VERIFICATION_FAILED (1~5): 로컬 카운트 클램프 후 계속 입력
              registerRemoteFailure()
            } catch {
              registerRemoteFailure()
            } finally {
              setRemoteVerifying(false)
            }
            return
          }

          const verified = await verifyTotpCode({
            email: user.email,
            otpCode: codeToVerify,
          })

          if (verified) {
            setMfaVerified()
            try {
              form.resetFields()
            } catch {
              console.debug('Form not connected, skipping resetFields')
            }
            setOtpCode('')
          } else {
            clearOtpInput()
          }
        } catch (error: unknown) {
          const errMsg = unknownErrorText(error, '인증에 실패했습니다.')
          clearOtpInput()
          if (!displayIsLocked && !errMsg.includes('인증 시도 횟수')) {
            try {
              form.setFields([{ name: 'otpCode', errors: [errMsg] }])
            } catch {
              console.debug('Form not connected, skipping setFields (verify error)')
            }
          }
        }
      } finally {
        verifyInFlightRef.current = false
      }
    },
    [
      user,
      isRemoteMfa,
      mfaState?.challengeUuid,
      verifyTotpCode,
      completeAdminAuth,
      setMfaVerified,
      form,
      clearOtpInput,
      displayIsLocked,
      ensureRemoteNotLocked,
      registerRemoteFailure,
      resetRemoteLockState,
      applyRemoteAccountLock,
    ]
  )

  const onOtpCodeChange = useCallback(
    (value: string) => {
      setOtpCode(value)
      if (
        value.length === OTP_LENGTH &&
        !displayIsLocked &&
        !isBusy &&
        user?.email &&
        /^\d+$/.test(value)
      ) {
        void verifyAndComplete(value)
      }
    },
    [displayIsLocked, isBusy, user?.email, verifyAndComplete]
  )

  const handleVerify = useCallback(
    async (values?: { otpCode?: string }) => {
      if (!user) {
        return
      }

      try {
        await form.validateFields(['otpCode'])
        const formValues = form.getFieldsValue()
        const finalCode = formValues.otpCode || values?.otpCode || otpCode
        if (!finalCode) return
        setOtpCode(finalCode)
        await verifyAndComplete(finalCode)
      } catch {
        return
      }
    },
    [user, otpCode, form, verifyAndComplete]
  )

  const lockMessage =
    displayIsLocked && displayLockUntil
      ? `인증 시도 횟수를 초과했습니다. ${OTP_POLICY.lockoutDurationMinutes}분 후 다시 시도해주세요.`
      : null

  return {
    form,
    otpCode,
    setOtpCode,
    mfaState,
    provisioning,
    provisioningLoading,
    provisioningError,
    isLocalTestMfa,
    failedAttempts: clampMfaFailedAttempts(displayFailedAttempts),
    isLocked: displayIsLocked,
    lockUntil: displayLockUntil,
    verifying: verifying || remoteVerifying,
    handleVerify,
    onOtpCodeChange,
    refreshProvisioning,
    lockMessage,
    otpResetToken,
  }
}
