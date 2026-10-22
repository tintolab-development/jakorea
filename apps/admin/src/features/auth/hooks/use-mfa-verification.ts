/**
 * MFA 인증 모달 로직 Hook
 * CMS `use-mfa-verification` 원격 MFA 잠금 상태머신과 동일 (5회 · 30분 ACCOUNT_LOCKED)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Form } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { getTotpProvisioning, verifyTotp } from '@/entities/auth/api/mfa-service'
import {
  OTP_LENGTH,
  OTP_POLICY,
  clampMfaFailedAttempts,
  isAdminLocalTestMfa,
} from '@/shared/constants/mfa-policy'
import type { TotpProvisioning } from '@/entities/auth/model/types'

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
  /** 첫 등록일 때만 QR을 보여 주고, 기등록 계정은 OTP만 받는다. */
  showQrSetup: boolean
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

function unknownErrorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useMfaVerification({
  open,
}: UseMfaVerificationOptions): UseMfaVerificationResult {
  const { user, mfaState, completeAdminAuth } = useAuthStore()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  const [provisioning, setProvisioning] = useState<TotpProvisioning | null>(null)
  const [provisioningLoading, setProvisioningLoading] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)
  const [forceOtpOnly, setForceOtpOnly] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockUntil, setLockUntil] = useState<string | null>(null)
  const [otpResetToken, setOtpResetToken] = useState(0)
  const verifyInFlightRef = useRef(false)
  const failedAttemptsRef = useRef(0)
  /** <Form form={form}> 가 한 번이라도 마운트됐는지. 모달 body는 최초 open 전까지 렌더되지 않는다. */
  const formConnectedRef = useRef(false)

  useEffect(() => {
    if (open) formConnectedRef.current = true
  }, [open])

  /** Form 미연결 상태에서 form 인스턴스를 만지면 antd가 경고를 찍으므로 연결 이후에만 실행한다. */
  const runOnForm = useCallback(
    (action: (formInstance: FormInstance) => void) => {
      if (!formConnectedRef.current) return
      action(form)
    },
    [form]
  )

  const isLocalTestMfa =
    Boolean(mfaState?.challengeUuid) &&
    isAdminLocalTestMfa(mfaState?.mfaMethod) &&
    !provisioning &&
    !provisioningLoading
  const showQrSetup =
    Boolean(mfaState?.challengeUuid) &&
    mfaState?.mfaSetupRequired !== false &&
    !isLocalTestMfa &&
    !forceOtpOnly

  const clearOtpInput = useCallback(() => {
    runOnForm(formInstance => {
      formInstance.setFields([{ name: 'otpCode', errors: [] }])
      formInstance.setFieldsValue({ otpCode: '' })
    })
    setOtpCode('')
    setOtpResetToken(token => token + 1)
  }, [runOnForm])

  const resetLockState = useCallback(() => {
    failedAttemptsRef.current = 0
    setFailedAttempts(0)
    setIsLocked(false)
    setLockUntil(null)
  }, [])

  const applyAccountLock = useCallback(() => {
    failedAttemptsRef.current = OTP_POLICY.maxFailedAttempts
    setFailedAttempts(OTP_POLICY.maxFailedAttempts)
    const lockTime = new Date(Date.now() + OTP_POLICY.lockoutDurationMinutes * 60 * 1000)
    setIsLocked(true)
    setLockUntil(lockTime.toISOString())
  }, [])

  /** 원격 MFA 실패 기록. 5회째(max) 도달 시 잠금. UI는 5 초과 표시 금지. */
  const registerFailure = useCallback(() => {
    if (isLocked) {
      clearOtpInput()
      return
    }
    const next = clampMfaFailedAttempts(failedAttemptsRef.current + 1)
    failedAttemptsRef.current = next
    setFailedAttempts(next)
    if (next >= OTP_POLICY.maxFailedAttempts) {
      applyAccountLock()
    }
    clearOtpInput()
  }, [clearOtpInput, isLocked, applyAccountLock])

  const ensureNotLocked = useCallback((): boolean => {
    if (!isLocked || !lockUntil) return true
    const lockTime = new Date(lockUntil)
    if (lockTime > new Date()) {
      clearOtpInput()
      return false
    }
    resetLockState()
    return true
  }, [isLocked, lockUntil, clearOtpInput, resetLockState])

  const refreshProvisioning = useCallback(async () => {
    if (!showQrSetup || !user?.email) return

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
      if (e instanceof AdminMfaApiError && e.code === 'MFA_ALREADY_ENROLLED') {
        setForceOtpOnly(true)
        setProvisioning(null)
        setProvisioningError(null)
        return
      }
      setProvisioningError(unknownErrorText(e, 'QR 정보를 불러오지 못했습니다.'))
      setProvisioning(null)
    } finally {
      setProvisioningLoading(false)
    }
  }, [
    user?.email,
    showQrSetup,
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
      setForceOtpOnly(false)
      resetLockState()
    }
  }, [open, showQrSetup, user?.email, refreshProvisioning, resetLockState])

  useEffect(() => {
    if (!open) {
      setOtpCode('')
      const frameId = requestAnimationFrame(() => {
        runOnForm(formInstance => formInstance.resetFields())
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [open, runOnForm])

  const verifyAndComplete = useCallback(
    async (codeToVerify: string) => {
      if (verifyInFlightRef.current) return
      if (isLocked) {
        clearOtpInput()
        return
      }
      verifyInFlightRef.current = true
      try {
        if (!user?.email) return

        if (codeToVerify.length !== OTP_LENGTH) {
          runOnForm(formInstance =>
            formInstance.setFields([
              { name: 'otpCode', errors: [`인증번호는 ${OTP_LENGTH}자리입니다.`] },
            ])
          )
          return
        }

        if (!/^\d+$/.test(codeToVerify)) {
          runOnForm(formInstance =>
            formInstance.setFields([
              { name: 'otpCode', errors: ['인증번호는 숫자만 입력 가능합니다.'] },
            ])
          )
          return
        }

        if (!mfaState?.challengeUuid) {
          runOnForm(formInstance =>
            formInstance.setFields([
              { name: 'otpCode', errors: ['MFA challenge가 없습니다. 로그인부터 다시 시도하세요.'] },
            ])
          )
          return
        }

        if (!ensureNotLocked()) {
          return
        }

        setVerifying(true)
        try {
          const response = await verifyTotp(user.email, codeToVerify, {
            challengeUuid: mfaState.challengeUuid,
          })

          if (response.verified && response.tokens) {
            resetLockState()
            completeAdminAuth(response.tokens)
            runOnForm(formInstance => formInstance.resetFields())
            setOtpCode('')
            return
          }

          // BE ACCOUNT_LOCKED(5회째): 입력 중단·횟수 증가 UI 중단
          if (response.isLocked || response.errorCode === 'ACCOUNT_LOCKED') {
            applyAccountLock()
            clearOtpInput()
            return
          }

          // MFA_VERIFICATION_FAILED (1~4): 로컬 카운트 클램프 후 계속 입력
          registerFailure()
        } catch {
          registerFailure()
        } finally {
          setVerifying(false)
        }
      } finally {
        verifyInFlightRef.current = false
      }
    },
    [
      user,
      mfaState?.challengeUuid,
      completeAdminAuth,
      runOnForm,
      clearOtpInput,
      isLocked,
      ensureNotLocked,
      registerFailure,
      resetLockState,
      applyAccountLock,
    ]
  )

  const onOtpCodeChange = useCallback(
    (value: string) => {
      setOtpCode(value)
      if (
        value.length === OTP_LENGTH &&
        !isLocked &&
        !verifying &&
        user?.email &&
        /^\d+$/.test(value)
      ) {
        void verifyAndComplete(value)
      }
    },
    [isLocked, verifying, user?.email, verifyAndComplete]
  )

  const handleVerify = useCallback(
    async (values?: { otpCode?: string }) => {
      if (!user || !formConnectedRef.current) return

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
    isLocked && lockUntil
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
    showQrSetup,
    isLocalTestMfa,
    failedAttempts: clampMfaFailedAttempts(failedAttempts),
    isLocked,
    lockUntil,
    verifying,
    handleVerify,
    onOtpCodeChange,
    refreshProvisioning,
    lockMessage,
    otpResetToken,
  }
}
