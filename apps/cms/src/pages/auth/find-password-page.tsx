/**
 * 비밀번호 찾기 페이지
 */

import { Form } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  changePasswordAfterReset,
  FIND_PASSWORD_VERIFICATION_TTL_MS,
  sendPasswordVerificationEmail,
  verifyFindPasswordEmail,
} from '@/features/auth/api/find-password-service'
import { useFindPasswordIdentityVerification } from '@/features/auth/identity-verification'
import {
  FindPasswordChangeForm,
  FIND_PASSWORD_WRONG_CURRENT_MESSAGE,
} from '@/features/auth/ui/find-password/change-password-form'
import { FindPasswordCompleteView } from '@/features/auth/ui/find-password/complete-view'
import {
  FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE,
  FindPasswordForm,
} from '@/features/auth/ui/find-password/form'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'

import './find-password-page.css'

type FindPasswordView = 'form' | 'changePassword' | 'complete'

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function FindPasswordPage() {
  const navigate = useNavigate()
  const [emailForm] = Form.useForm<{ email: string }>()
  const [passwordForm] = Form.useForm<{
    currentPassword: string
    newPassword: string
    newPasswordConfirm: string
  }>()

  const [view, setView] = useState<FindPasswordView>('form')
  const [email, setEmail] = useState('')
  const [resetSessionUuid, setResetSessionUuid] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [wrongCurrentMessage, setWrongCurrentMessage] = useState<string | null>(null)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [verificationStarted, setVerificationStarted] = useState(false)
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<number | null>(null)
  const [verificationExpired, setVerificationExpired] = useState(false)

  const startVerificationTimer = useCallback(() => {
    setVerificationStarted(true)
    setVerificationExpired(false)
    setVerificationExpiresAt(Date.now() + FIND_PASSWORD_VERIFICATION_TTL_MS)
  }, [])

  const resetVerificationTimer = useCallback(() => {
    setVerificationStarted(false)
    setVerificationExpired(false)
    setVerificationExpiresAt(null)
  }, [])

  const goToChangePassword = useCallback((sessionUuid: string, verifiedEmail: string) => {
    setEmail(verifiedEmail)
    setResetSessionUuid(sessionUuid)
    resetVerificationTimer()
    setView('changePassword')
  }, [resetVerificationTimer])

  const handleIdentitySuccess = useCallback(
    (result: { sessionUuid?: string; sessionId: number }) => {
      const verifiedEmail = normalizeEmail(emailForm.getFieldValue('email') ?? '')
      const sessionUuid = result.sessionUuid ?? String(result.sessionId)
      goToChangePassword(sessionUuid, verifiedEmail)
    },
    [emailForm, goToChangePassword]
  )

  const { verify, isVerifying, errorMessage, resetError } = useFindPasswordIdentityVerification({
    onSuccess: handleIdentitySuccess,
  })

  useEffect(() => {
    if (!verificationStarted || view !== 'form' || !verificationExpiresAt) {
      return
    }

    const tick = () => {
      if (Date.now() >= verificationExpiresAt) {
        setVerificationExpired(true)
      }
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [verificationExpiresAt, verificationStarted, view])

  const validateEmailRegistered = useCallback(async () => {
    const values = await emailForm.validateFields()
    const normalizedEmail = normalizeEmail(values.email)
    setEmailError(null)
    resetError()

    const result = await verifyFindPasswordEmail(normalizedEmail)
    if (result.kind === 'not_found') {
      setEmailError(FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE)
      return null
    }

    return normalizedEmail
  }, [emailForm, resetError])

  const handleIdentityVerify = useCallback(async () => {
    if (verificationExpired) {
      resetVerificationTimer()
    }

    try {
      const normalizedEmail = await validateEmailRegistered()
      if (!normalizedEmail) {
        return
      }

      startVerificationTimer()
      await verify()
    } catch {
      // validation errors handled by form
    }
  }, [
    resetVerificationTimer,
    startVerificationTimer,
    validateEmailRegistered,
    verificationExpired,
    verify,
  ])

  const handleSendVerificationEmail = useCallback(async () => {
    if (verificationExpired) {
      resetVerificationTimer()
    }

    setIsEmailSending(true)
    setEmailError(null)

    try {
      const normalizedEmail = await validateEmailRegistered()
      if (!normalizedEmail) {
        return
      }

      startVerificationTimer()
      const result = await sendPasswordVerificationEmail(normalizedEmail)
      goToChangePassword(result.resetSessionUuid, normalizedEmail)
    } catch {
      // validation errors handled by form
    } finally {
      setIsEmailSending(false)
    }
  }, [
    goToChangePassword,
    resetVerificationTimer,
    startVerificationTimer,
    validateEmailRegistered,
    verificationExpired,
  ])

  const handlePasswordChange = useCallback(async () => {
    const values = await passwordForm.validateFields()
    setWrongCurrentMessage(null)
    setIsPasswordSubmitting(true)

    try {
      const result = await changePasswordAfterReset({
        email,
        resetSessionUuid,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      if (result.kind === 'wrong_current') {
        setWrongCurrentMessage(FIND_PASSWORD_WRONG_CURRENT_MESSAGE)
        return
      }

      if (result.kind === 'same_as_old') {
        passwordForm.setFields([
          {
            name: 'newPassword',
            errors: ['새 비밀번호가 기존 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요'],
          },
        ])
        return
      }

      if (result.kind === 'invalid_new_password') {
        return
      }

      setView('complete')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }, [email, passwordForm, resetSessionUuid])

  const cardClassName =
    view === 'complete'
      ? 'auth-card--find-password-complete'
      : view === 'changePassword'
        ? 'auth-card--find-password-change'
        : 'auth-card--find-password'

  const showVerificationExpired =
    view === 'form' && verificationStarted && verificationExpired && !isVerifying

  return (
    <AuthPageShell showLogo={false} cardClassName={cardClassName}>
      <div className="find-password-page-content">
        {view === 'form' ? (
          <FindPasswordForm
            form={emailForm}
            emailError={emailError ?? errorMessage}
            isIdentityLoading={isVerifying}
            isEmailSending={isEmailSending}
            showVerificationExpired={showVerificationExpired}
            onIdentityVerify={() => {
              void handleIdentityVerify()
            }}
            onSendVerificationEmail={() => {
              void handleSendVerificationEmail()
            }}
          />
        ) : null}

        {view === 'changePassword' ? (
          <FindPasswordChangeForm
            form={passwordForm}
            isSubmitting={isPasswordSubmitting}
            wrongCurrentMessage={wrongCurrentMessage}
            onSubmit={() => {
              void handlePasswordChange()
            }}
          />
        ) : null}

        {view === 'complete' ? (
          <FindPasswordCompleteView
            onGoLogin={() => {
              navigate('/login', { replace: true })
            }}
          />
        ) : null}
      </div>
    </AuthPageShell>
  )
}
