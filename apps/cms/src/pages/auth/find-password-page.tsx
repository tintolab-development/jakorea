/**
 * 비밀번호 찾기 페이지
 */

import { Form } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  changePasswordAfterReset,
  FIND_PASSWORD_VERIFICATION_TTL_MS,
  verifyFindPasswordEmail,
} from '@/features/auth/api/find-password-service'
import { useFindPasswordIdentityVerification } from '@/features/auth/identity-verification'
import { FindPasswordChangeForm } from '@/features/auth/ui/find-password/change-password-form'
import { FindPasswordCompleteView } from '@/features/auth/ui/find-password/complete-view'
import {
  FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE,
  FIND_PASSWORD_INVALID_EMAIL_DOMAIN_MESSAGE,
  FindPasswordForm,
} from '@/features/auth/ui/find-password/form'
import { isValidJakoreaEmail } from '@/features/auth/lib/jakorea-email'
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
    newPassword: string
    newPasswordConfirm: string
  }>()

  const [view, setView] = useState<FindPasswordView>('form')
  const [email, setEmail] = useState('')
  const [identityVerificationSessionId, setIdentityVerificationSessionId] = useState<number | null>(
    null
  )
  const [profileToken, setProfileToken] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null)
  const [isEmailChecking, setIsEmailChecking] = useState(false)
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

  const goToChangePassword = useCallback(
    (input: {
      verifiedEmail: string
      sessionId: number
      profileToken: string
    }) => {
      setEmail(input.verifiedEmail)
      setIdentityVerificationSessionId(input.sessionId)
      setProfileToken(input.profileToken)
      setPasswordSubmitError(null)
      passwordForm.resetFields()
      resetVerificationTimer()
      setView('changePassword')
    },
    [passwordForm, resetVerificationTimer]
  )

  const handleIdentitySuccess = useCallback(
    (result: { sessionUuid?: string; sessionId: number; profileToken?: string }) => {
      const verifiedEmail = normalizeEmail(emailForm.getFieldValue('email') ?? '')
      goToChangePassword({
        verifiedEmail,
        sessionId: result.sessionId,
        profileToken: result.profileToken ?? '',
      })
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

  const clearEmailError = useCallback(() => {
    setEmailError(null)
    resetError()
  }, [resetError])

  const validateEmailRegistered = useCallback(async () => {
    clearEmailError()

    let values: { email: string }
    try {
      values = await emailForm.validateFields()
    } catch {
      const fieldError = emailForm.getFieldError('email')[0]
      if (fieldError) {
        setEmailError(fieldError)
      }
      return null
    }

    const normalizedEmail = normalizeEmail(values.email)

    if (!isValidJakoreaEmail(normalizedEmail)) {
      setEmailError(FIND_PASSWORD_INVALID_EMAIL_DOMAIN_MESSAGE)
      return null
    }

    setIsEmailChecking(true)

    try {
      const result = await verifyFindPasswordEmail(normalizedEmail)
      if (result.kind === 'not_found') {
        setEmailError(FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE)
        return null
      }

      return normalizedEmail
    } catch {
      setEmailError('이메일 확인에 실패했어요. 다시 시도해 주세요.')
      return null
    } finally {
      setIsEmailChecking(false)
    }
  }, [clearEmailError, emailForm])

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

  const handlePasswordChange = useCallback(async () => {
    if (identityVerificationSessionId == null) {
      setPasswordSubmitError('본인인증 정보가 없습니다. 처음부터 다시 진행해 주세요.')
      return
    }

    const values = await passwordForm.validateFields()
    setPasswordSubmitError(null)
    setIsPasswordSubmitting(true)

    try {
      const result = await changePasswordAfterReset({
        email,
        identityVerificationSessionId,
        profileToken,
        newPassword: values.newPassword,
        newPasswordConfirm: values.newPasswordConfirm,
      })

      if (result.kind === 'invalid_new_password') {
        return
      }

      if (result.kind === 'api_error') {
        setPasswordSubmitError(result.message)
        return
      }

      setView('complete')
    } finally {
      setIsPasswordSubmitting(false)
    }
  }, [email, identityVerificationSessionId, passwordForm, profileToken])

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
            isIdentityLoading={isVerifying || isEmailChecking}
            showVerificationExpired={showVerificationExpired}
            onEmailChange={clearEmailError}
            onIdentityVerify={() => {
              void handleIdentityVerify()
            }}
          />
        ) : null}

        {view === 'changePassword' ? (
          <FindPasswordChangeForm
            form={passwordForm}
            isSubmitting={isPasswordSubmitting}
            submitError={passwordSubmitError}
            onPasswordChange={() => {
              setPasswordSubmitError(null)
            }}
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
