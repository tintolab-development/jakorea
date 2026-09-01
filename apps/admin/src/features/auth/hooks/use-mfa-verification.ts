/**
 * MFA 인증 모달 로직 Hook (실 API TOTP)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Form } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getTotpProvisioning, verifyTotp } from '@/entities/auth/api/mfa-service'
import { OTP_LENGTH, isAdminLocalTestMfa } from '@/shared/constants/mfa-policy'
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
  isLocalTestMfa: boolean
  failedAttempts: number
  isLocked: boolean
  verifying: boolean
  handleVerify: (values?: { otpCode?: string }) => Promise<void>
  onOtpCodeChange: (value: string) => void
  refreshProvisioning: () => Promise<void>
  lockMessage: string | null
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
  const [verifying, setVerifying] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const verifyInFlightRef = useRef(false)

  const isLocalTestMfa =
    Boolean(mfaState?.challengeUuid) &&
    isAdminLocalTestMfa(mfaState?.mfaMethod) &&
    !provisioning &&
    !provisioningLoading

  const clearOtpInput = useCallback(() => {
    try {
      form.setFields([{ name: 'otpCode', errors: [] }])
      form.setFieldsValue({ otpCode: '' })
    } catch {
      // form 미연결
    }
    setOtpCode('')
  }, [form])

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
      setProvisioningError(unknownErrorText(e, 'QR 정보를 불러오지 못했습니다.'))
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
      setFailedAttempts(0)
    }
  }, [open, user?.email, refreshProvisioning])

  useEffect(() => {
    if (!open) {
      setOtpCode('')
      const frameId = requestAnimationFrame(() => {
        try {
          form.resetFields()
        } catch {
          // form 미연결
        }
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [open, form])

  const verifyAndComplete = useCallback(
    async (codeToVerify: string) => {
      if (verifyInFlightRef.current) return
      verifyInFlightRef.current = true
      try {
        if (!user?.email) return

        if (codeToVerify.length !== OTP_LENGTH) {
          form.setFields([
            { name: 'otpCode', errors: [`인증번호는 ${OTP_LENGTH}자리입니다.`] },
          ])
          return
        }

        if (!/^\d+$/.test(codeToVerify)) {
          form.setFields([{ name: 'otpCode', errors: ['인증번호는 숫자만 입력 가능합니다.'] }])
          return
        }

        if (!mfaState?.challengeUuid) {
          form.setFields([
            { name: 'otpCode', errors: ['MFA challenge가 없습니다. 로그인부터 다시 시도하세요.'] },
          ])
          return
        }

        setVerifying(true)
        try {
          const response = await verifyTotp(user.email, codeToVerify, {
            challengeUuid: mfaState.challengeUuid,
          })

          if (response.verified && response.tokens) {
            setFailedAttempts(0)
            completeAdminAuth(response.tokens)
            form.resetFields()
            setOtpCode('')
            return
          }

          setFailedAttempts(prev => prev + 1)
          const errMsg = response.detail || '인증에 실패했습니다.'
          form.setFields([{ name: 'otpCode', errors: [errMsg] }])
          clearOtpInput()
        } finally {
          setVerifying(false)
        }
      } finally {
        verifyInFlightRef.current = false
      }
    },
    [user, mfaState?.challengeUuid, completeAdminAuth, form, clearOtpInput]
  )

  const onOtpCodeChange = useCallback(
    (value: string) => {
      setOtpCode(value)
      if (value.length === OTP_LENGTH && !verifying && user?.email && /^\d+$/.test(value)) {
        void verifyAndComplete(value)
      }
    },
    [verifying, user?.email, verifyAndComplete]
  )

  const handleVerify = useCallback(
    async (values?: { otpCode?: string }) => {
      if (!user) return

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

  return {
    form,
    otpCode,
    setOtpCode,
    mfaState,
    provisioning,
    provisioningLoading,
    provisioningError,
    isLocalTestMfa,
    failedAttempts,
    isLocked: false,
    verifying,
    handleVerify,
    onOtpCodeChange,
    refreshProvisioning,
    lockMessage: null,
  }
}
