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
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { OTP_LENGTH, OTP_POLICY, clampMfaFailedAttempts, isAdminLocalTestMfa } from '@/shared/constants/mfa-policy'
import { unknownErrorText } from '@/shared/utils/error-handler'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { TotpProvisioning } from '@/types/mfa'

/** 코드 불일치가 아닌 일시 오류(네트워크·서버 등) — 2단계 인증 팝업 위 알럿 */
export const MFA_TEMPORARY_FAILURE_ALERT_TITLE = 'MFA 인증 실패 안내'
export const MFA_TEMPORARY_FAILURE_ALERT_CONTENT =
  '일시적인 오류로 MFA 인증에 실패하였습니다.\n잠시 후 다시 시도해 주세요.'

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
  /** 첫 등록일 때만 QR을 보여 준다. 기등록 계정은 OTP만 받는다. */
  showQrSetup: boolean
  verifyNotice: string | null
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
  const [forceOtpOnly, setForceOtpOnly] = useState(false)
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)
  const [remoteVerifying, setRemoteVerifying] = useState(false)
  const [remoteFailedAttempts, setRemoteFailedAttempts] = useState(0)
  const [remoteIsLocked, setRemoteIsLocked] = useState(false)
  const [remoteLockUntil, setRemoteLockUntil] = useState<string | null>(null)
  const [otpResetToken, setOtpResetToken] = useState(0)
  const verifyInFlightRef = useRef(false)
  const remoteFailedAttemptsRef = useRef(0)
  /** <Form form={form}> 가 한 번이라도 마운트됐는지. 모달 body는 최초 open 전까지 렌더되지 않는다. */
  const formConnectedRef = useRef(false)
  const isBusy = verifying || remoteVerifying
  const { showAlert } = useCmsAlert()

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

  const isRemoteMfa = Boolean(mfaState?.challengeUuid)
  const isLocalTestMfa = isRemoteMfa && isAdminLocalTestMfa(mfaState?.mfaMethod)
  const showQrSetup =
    isRemoteMfa && mfaState?.mfaSetupRequired === true && !isLocalTestMfa && !forceOtpOnly
  const displayFailedAttempts = isRemoteMfa ? remoteFailedAttempts : failedAttempts
  const displayIsLocked = isRemoteMfa ? remoteIsLocked : isLocked
  const displayLockUntil = isRemoteMfa ? remoteLockUntil : lockUntil

  const clearOtpInput = useCallback(() => {
    runOnForm(formInstance => {
      formInstance.setFields([{ name: 'otpCode', errors: [] }])
      formInstance.setFieldsValue({ otpCode: '' })
    })
    setOtpCode('')
    setOtpResetToken(token => token + 1)
  }, [runOnForm])

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

  /** 원격 MFA 실패 기록. 5회째(max) 도달 시 잠금. UI는 5 초과 표시 금지. */
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

  /**
   * 일시 오류 — 실패 횟수에 넣지 않고 상단 안내도 띄우지 않는다.
   * 입력을 비운 뒤(첫 칸 포커스) 알럿을 띄우므로, 알럿을 닫으면 팝업이 처음 열린 상태로 남는다.
   */
  const handleTemporaryVerifyFailure = useCallback(() => {
    setVerifyNotice(null)
    clearOtpInput()
    showAlert({
      title: MFA_TEMPORARY_FAILURE_ALERT_TITLE,
      content: MFA_TEMPORARY_FAILURE_ALERT_CONTENT,
    })
  }, [clearOtpInput, showAlert])

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
    if (!showQrSetup || !user?.email || !mfaState?.challengeUuid) return

    setProvisioningLoading(true)
    setProvisioningError(null)
    try {
      const next = await getTotpProvisioning(user.email, {
        challengeUuid: mfaState.challengeUuid,
        mfaMethod: mfaState.mfaMethod,
      })
      if (!next?.qrDataUrl && !next?.manualSecret) {
        setProvisioning(null)
        setProvisioningError('QR 정보를 불러오지 못했습니다.')
        return
      }
      setProvisioning(next)
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
  }, [showQrSetup, user?.email, mfaState?.challengeUuid, mfaState?.mfaMethod])

  useEffect(() => {
    if (open && showQrSetup) {
      void refreshProvisioning()
    }
    if (!open) {
      setProvisioning(null)
      setProvisioningError(null)
      setForceOtpOnly(false)
      setVerifyNotice(null)
      // 연속 실패 횟수·잠금은 팝업을 닫아도 유지한다(인증 성공 시에만 초기화)
    }
  }, [open, showQrSetup, refreshProvisioning])

  useEffect(() => {
    if (!open) {
      setOtpCode('')
      resetVerification()
      const frameId = requestAnimationFrame(() => {
        runOnForm(formInstance => formInstance.resetFields())
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [open, runOnForm, resetVerification])

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
                setVerifyNotice(null)
                completeAdminAuth(response.tokens)
                runOnForm(formInstance => formInstance.resetFields())
                setOtpCode('')
                return
              }

              if (response.isLocked || response.errorCode === 'ACCOUNT_LOCKED') {
                applyRemoteAccountLock()
                setVerifyNotice(response.detail)
                clearOtpInput()
                return
              }

              if (
                response.errorCode === 'MFA_CHALLENGE_INVALID' ||
                response.errorCode === 'MFA_CHALLENGE_EXPIRED' ||
                response.errorCode === 'MFA_NOT_CONFIGURED' ||
                response.errorCode === 'MFA_RATE_LIMITED' ||
                response.errorCode === 'VALIDATION_ERROR' ||
                // 사용 불가 계정 — 서버 message 를 그대로 노출 (잠금·일시 오류 아님)
                response.errorCode === 'ACCOUNT_INACTIVE' ||
                response.errorCode === 'LOGIN_DISABLED'
              ) {
                setVerifyNotice(response.detail)
                clearOtpInput()
                return
              }

              if (response.errorCode === 'MFA_VERIFICATION_FAILED') {
                // 코드 불일치 — 입력칸 아래 「잘못된 코드를 입력하였습니다. (실패 횟수 n / 5)」만 노출.
                registerRemoteFailure()
                return
              }

              // 그 밖의 실패(네트워크·서버 오류 등) — 「MFA 인증 실패 안내」 알럿
              handleTemporaryVerifyFailure()
            } catch {
              handleTemporaryVerifyFailure()
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
            runOnForm(formInstance => formInstance.resetFields())
            setOtpCode('')
          } else {
            clearOtpInput()
          }
        } catch (error: unknown) {
          const errMsg = unknownErrorText(error, '인증에 실패했습니다.')
          clearOtpInput()
          if (!displayIsLocked && !errMsg.includes('인증 시도 횟수')) {
            runOnForm(formInstance =>
              formInstance.setFields([{ name: 'otpCode', errors: [errMsg] }])
            )
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
      runOnForm,
      clearOtpInput,
      displayIsLocked,
      ensureRemoteNotLocked,
      registerRemoteFailure,
      resetRemoteLockState,
      applyRemoteAccountLock,
      handleTemporaryVerifyFailure,
    ]
  )

  const onOtpCodeChange = useCallback(
    (value: string) => {
      setOtpCode(value)
      if (value) setVerifyNotice(null)
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
      if (!user || !formConnectedRef.current) {
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
    showQrSetup,
    verifyNotice,
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
