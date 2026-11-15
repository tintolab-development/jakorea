import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  continueAdminRegisteredSessionAfterPasswordChange,
  normalizeAdminProvisionedOnboardingStep,
  requireAdminRegisteredWizardState,
  resolveAdminProvisionedOnboardingPath,
  validateAdminRegisteredChangePassword,
} from '@/features/auth/admin-registered'
import { MEMBER_PASSWORD_HELP_TEXT } from '@/features/auth/sign-up'
import {
  isPasswordRecentlyUsedApiError,
  readLoginApiServerMessage,
  resolveLoginApiFailureAlert,
  usePortalPasswordChangeMutation,
} from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal, PFButton, PFText, PFTextInput } from '@/shared/ui'
import sharedStyles from './shared.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const PASSWORD_HELP_TEXT = MEMBER_PASSWORD_HELP_TEXT

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
  /** 최근 사용한 비밀번호 재사용 — 시안 「비밀번호 재사용 시」 팝업 */
  const [passwordReusedOpen, setPasswordReusedOpen] = useState(false)
  /** 요청 실패 — 시안 「처리 실패 / 처리 제한 / 네트워크 오류」 팝업 */
  const [errorAlert, setErrorAlert] = useState<PlatformAlertCopy | null>(null)

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
      let changeTokens: Awaited<ReturnType<typeof passwordChangeMutation.mutateAsync>>
      try {
        changeTokens = await passwordChangeMutation.mutateAsync({
          currentPassword: currentPassword.trim(),
          newPassword: nextPassword,
        })
      } catch (error) {
        if (isPasswordRecentlyUsedApiError(error)) {
          setPasswordReusedOpen(true)
          return
        }
        // 서버 업무 메시지는 화면 문구로, 그 밖의 실패는 시안 공통 팝업으로
        const failureAlert = resolveLoginApiFailureAlert(error)
        if (failureAlert) {
          setErrorAlert(failureAlert)
        } else {
          setCurrentPasswordError(readLoginApiServerMessage(error))
        }
        return
      }

      setIsContinuingSession(true)
      try {
        const tokens = await continueAdminRegisteredSessionAfterPasswordChange({
          email,
          password: nextPassword,
          changeTokens,
        })
        const step =
          normalizeAdminProvisionedOnboardingStep(tokens.adminProvisionedOnboardingStep) ??
          'PROFILE_REVIEW'
        navigate(resolveAdminProvisionedOnboardingPath(step) ?? '/auth/admin-registered/confirm')
        return
      } catch (error) {
        // 서버 업무 메시지는 화면 문구로, 그 밖의 실패는 시안 공통 팝업으로
        const failureAlert = resolveLoginApiFailureAlert(error)
        if (failureAlert) {
          setErrorAlert(failureAlert)
        } else {
          setSubmitError(readLoginApiServerMessage(error))
        }
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
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
          안전한 계정 이용을 위해 주기적으로 변경해 주세요.
        </PFText>
      </div>

      <div className={sharedStyles.content}>
        <div className={sharedStyles.passwordInputsContainer}>
          <PFTextInput
            size="xlarge"
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호를 입력해 주세요"
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
      <PFAlertModal
        open={passwordReusedOpen}
        title={PLATFORM_ALERT_COPY.passwordRecentlyUsed.title}
        description={PLATFORM_ALERT_COPY.passwordRecentlyUsed.description}
        onConfirm={() => setPasswordReusedOpen(false)}
      />
      <PFAlertModal
        open={errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => setErrorAlert(null)}
      />
    </section>
  )
}
