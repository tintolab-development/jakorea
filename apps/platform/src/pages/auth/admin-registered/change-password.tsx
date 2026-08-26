import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  continueAdminRegisteredSessionAfterPasswordChange,
  normalizeAdminProvisionedOnboardingStep,
  requireAdminRegisteredWizardState,
  resolveAdminProvisionedOnboardingPath,
  validateAdminRegisteredChangePassword,
} from '@/features/auth/admin-registered'
import { getLoginApiErrorMessage, usePortalPasswordChangeMutation } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import sharedStyles from './shared.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const PASSWORD_HELP_TEXT = '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'

export function AdminRegisteredChangePasswordPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()
  const remoteApi = isRemoteApiConfigured()
  const passwordChangeMutation = usePortalPasswordChangeMutation()
  const [isContinuingSession, setIsContinuingSession] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState<string>()
  const [newPasswordError, setNewPasswordError] = useState<string>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()

  useEffect(() => {
    if (remoteApi) return
    if (!wizardState?.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, remoteApi, wizardState?.birthDate, wizardState?.gender])

  const clearErrors = () => {
    setCurrentPasswordError(undefined)
    setNewPasswordError(undefined)
    setConfirmPasswordError(undefined)
    setSubmitError(undefined)
  }

  if (!wizardState || (!remoteApi && (!wizardState.birthDate || !wizardState.gender))) {
    return null
  }

  const isBusy = passwordChangeMutation.isPending || isContinuingSession
  const { email } = wizardState

  const handleSubmit = async () => {
    if (isBusy) {
      return
    }

    const validation = validateAdminRegisteredChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
      initialPassword: email,
      matchCurrentToInitial: !remoteApi,
    })

    clearErrors()

    if (validation) {
      if (validation.field === 'current') {
        setCurrentPasswordError(validation.message)
      } else if (validation.field === 'new') {
        setNewPasswordError(validation.message)
      } else if (validation.field === 'confirm') {
        setConfirmPasswordError(validation.message)
      }
      return
    }

    const nextPassword = newPassword.trim()

    if (remoteApi) {
      try {
        await passwordChangeMutation.mutateAsync({
          currentPassword: currentPassword.trim(),
          newPassword: nextPassword,
        })
      } catch (error) {
        const message = getLoginApiErrorMessage(error, '비밀번호를 변경하지 못했습니다.')
        setCurrentPasswordError(message)
        return
      }

      setIsContinuingSession(true)
      try {
        const tokens = await continueAdminRegisteredSessionAfterPasswordChange({
          email,
          password: nextPassword,
        })
        const step =
          normalizeAdminProvisionedOnboardingStep(tokens.adminProvisionedOnboardingStep) ??
          'PROFILE_REVIEW'
        navigate(
          resolveAdminProvisionedOnboardingPath(step) ?? '/auth/admin-registered/confirm',
        )
        return
      } catch (error) {
        setSubmitError(
          getLoginApiErrorMessage(
            error,
            '비밀번호는 변경되었습니다. 가입 정보 확인으로 이어가지 못했습니다. 다시 시도해 주세요.',
          ),
        )
        return
      } finally {
        setIsContinuingSession(false)
      }
    }

    navigate('/auth/admin-registered/confirm')
  }

  return (
    <section>
      <div className={sharedStyles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          비밀번호를 변경해 주세요.
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          안전한 계정 이용을 위해 주기적으로 변경해 주세요.
        </PFText>
      </div>

      <div className={sharedStyles.content}>
        <div className={sharedStyles.passwordInputsContainer}>
          <PFTextInput
            size="xlarge"
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호를 입력해 주세요."
            autoComplete="current-password"
            required
            value={currentPassword}
            onValueChange={value => {
              setCurrentPassword(value)
              setCurrentPasswordError(undefined)
              setSubmitError(undefined)
            }}
            error={Boolean(currentPasswordError)}
            message={currentPasswordError}
            messageStatus="error"
          />
          <PFTextInput
            size="xlarge"
            label="새 비밀번호"
            type="password"
            placeholder="새 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            required
            value={newPassword}
            onValueChange={value => {
              setNewPassword(value)
              setNewPasswordError(undefined)
            }}
            error={Boolean(newPasswordError)}
            message={newPasswordError ?? PASSWORD_HELP_TEXT}
            messageStatus={newPasswordError ? 'error' : 'neutral'}
          />
          <PFTextInput
            size="xlarge"
            label="새 비밀번호 확인"
            type="password"
            placeholder="새 비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onValueChange={value => {
              setConfirmPassword(value)
              setConfirmPasswordError(undefined)
            }}
            error={Boolean(confirmPasswordError)}
            message={confirmPasswordError}
            messageStatus="error"
          />
        </div>
      </div>

      {submitError ? (
        <PFText as="p" typo="bd-sm-md" color="error" className={sharedStyles.message}>
          {submitError}
        </PFText>
      ) : null}

      <PFButton
        size="xlarge"
        width="100%"
        disabled={isBusy}
        onClick={() => {
          void handleSubmit()
        }}
      >
        {isBusy ? '변경 중…' : '비밀번호 변경하기'}
      </PFButton>
    </section>
  )
}
