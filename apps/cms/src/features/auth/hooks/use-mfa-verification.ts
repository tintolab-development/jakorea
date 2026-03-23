/**
 * MFA 인증 모달 로직 Hook
 * Phase 0.5.1: MFA/OTP UX — TOTP (Microsoft Authenticator)
 */

import { useState, useEffect, useCallback } from 'react'
import { Form, message } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfa } from '@/features/auth/hooks/use-mfa'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { getTotpProvisioning } from '@/entities/user/api/mfa-service'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'
import { MESSAGES } from '@/shared/constants'
import type { TotpProvisioning } from '@/types/mfa'

interface UseMfaVerificationOptions {
  open: boolean
  messageApi?: ReturnType<typeof import('antd').App.useApp>['message']
}

interface UseMfaVerificationResult {
  form: FormInstance
  otpCode: string
  setOtpCode: (value: string) => void
  mfaState: ReturnType<typeof useMfa>['mfaState']
  provisioning: TotpProvisioning | null
  provisioningLoading: boolean
  provisioningError: string | null
  failedAttempts: number
  isLocked: boolean
  lockUntil: string | null
  verifying: boolean
  handleVerify: (values?: { otpCode?: string }) => Promise<void>
  refreshProvisioning: () => Promise<void>
  lockMessage: string | null
}

export function useMfaVerification({
  open,
  messageApi,
}: UseMfaVerificationOptions): UseMfaVerificationResult {
  const { user, setMfaVerified } = useAuthStore()
  const { mfaState, initializeMfa, completeMfa } = useMfa()
  const { verifying, failedAttempts, isLocked, lockUntil, verifyTotpCode, reset: resetVerification } =
    useOtpVerification()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  const [provisioning, setProvisioning] = useState<TotpProvisioning | null>(null)
  const [provisioningLoading, setProvisioningLoading] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)

  const msg = messageApi || message

  const refreshProvisioning = useCallback(async () => {
    if (!user?.email) return
    setProvisioningLoading(true)
    setProvisioningError(null)
    try {
      const p = await getTotpProvisioning(user.email)
      setProvisioning(p)
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'QR 정보를 불러오지 못했습니다.'
      setProvisioningError(err)
      setProvisioning(null)
    } finally {
      setProvisioningLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    if (open && user && user.role === 'ADMIN' && !mfaState) {
      initializeMfa(user.id, user.email)
    }
  }, [open, user, mfaState, initializeMfa])

  useEffect(() => {
    if (open && user?.email && mfaState && !mfaState.isVerified) {
      void refreshProvisioning()
    }
    if (!open) {
      setProvisioning(null)
      setProvisioningError(null)
    }
  }, [open, user?.email, mfaState?.isVerified, refreshProvisioning])

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
      if (!user?.email) {
        msg.error('사용자 정보를 찾을 수 없습니다.')
        return
      }

      if (codeToVerify.length !== OTP_LENGTH) {
        try {
          form.setFields([
            { name: 'otpCode', errors: [`인증번호는 ${OTP_LENGTH}자리입니다.`] },
          ])
        } catch {
          msg.error(`인증번호는 ${OTP_LENGTH}자리입니다.`)
        }
        return
      }

      if (!/^\d+$/.test(codeToVerify)) {
        try {
          form.setFields([{ name: 'otpCode', errors: ['인증번호는 숫자만 입력 가능합니다.'] }])
        } catch {
          msg.error('인증번호는 숫자만 입력 가능합니다.')
        }
        return
      }

      try {
        const verified = await verifyTotpCode({
          email: user.email,
          otpCode: codeToVerify,
        })

        if (verified) {
          completeMfa()
          setMfaVerified()
          msg.success(MESSAGES.success.authenticated)
          try {
            form.resetFields()
          } catch {
            console.debug('Form not connected, skipping resetFields')
          }
          setOtpCode('')
        } else {
          try {
            form.setFields([{ name: 'otpCode', errors: ['인증번호가 올바르지 않습니다.'] }])
            form.setFieldsValue({ otpCode: '' })
          } catch {
            msg.error('인증번호가 올바르지 않습니다.')
          }
          setOtpCode('')
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : '인증에 실패했습니다.'
        try {
          form.setFields([{ name: 'otpCode', errors: [errMsg] }])
          form.setFieldsValue({ otpCode: '' })
        } catch {
          msg.error(errMsg)
        }
        setOtpCode('')
      }
    },
    [user, verifyTotpCode, completeMfa, setMfaVerified, form, msg]
  )

  const handleVerify = useCallback(
    async (values?: { otpCode?: string }) => {
      if (!user) {
        msg.error('사용자 정보를 찾을 수 없습니다.')
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
    [user, otpCode, form, verifyAndComplete, msg]
  )

  const lockMessage =
    isLocked && lockUntil ? `인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.` : null

  return {
    form,
    otpCode,
    setOtpCode,
    mfaState,
    provisioning,
    provisioningLoading,
    provisioningError,
    failedAttempts,
    isLocked,
    lockUntil,
    verifying,
    handleVerify,
    refreshProvisioning,
    lockMessage,
  }
}
