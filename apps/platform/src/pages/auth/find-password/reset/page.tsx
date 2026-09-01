import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFindPasswordRecoveryState,
  clearFindPasswordRecoveryState,
  usePortalPasswordResetConfirmMutation,
} from '@/features/auth/find-password'
import { isValidPassword } from '@/features/auth/sign-up'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const PASSWORD_HELP_TEXT = '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'
const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.'
const IDENTITY_REQUIRED_MESSAGE = '본인인증 정보가 없습니다. 처음부터 다시 진행해 주세요.'
const IDENTITY_MISMATCH_MESSAGE =
  '본인인증 정보가 이메일과 일치하지 않습니다. 처음부터 다시 진행해 주세요.'

export function FindPasswordResetPage() {
  const navigate = useNavigate()
  const remoteApi = isRemoteApiConfigured()
  const resetMutation = usePortalPasswordResetConfirmMutation()
  const [recovery] = useState(() => getFindPasswordRecoveryState())
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!recovery) {
      navigate('/auth/find-password', { replace: true })
    }
  }, [navigate, recovery])

  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit =
    isValidPassword(newPassword) && confirmPassword.length > 0 && newPassword === confirmPassword

  if (!recovery) {
    return null
  }

  const handleSubmit = async () => {
    if (!canSubmit || resetMutation.isPending) {
      return
    }

    if (recovery.identityVerificationSessionId == null) {
      setSubmitError(IDENTITY_REQUIRED_MESSAGE)
      return
    }

    if (remoteApi && !recovery.profileToken.trim()) {
      setSubmitError(IDENTITY_REQUIRED_MESSAGE)
      return
    }

    setSubmitError(null)

    if (remoteApi) {
      try {
        await resetMutation.mutateAsync({
          email: recovery.email,
          identityVerificationSessionId: recovery.identityVerificationSessionId,
          profileToken: recovery.profileToken,
          newPassword,
          newPasswordConfirm: confirmPassword,
        })
      } catch (error) {
        setSubmitError(getLoginApiErrorMessage(error, IDENTITY_MISMATCH_MESSAGE))
        return
      }
    }

    clearFindPasswordRecoveryState()
    navigate('/auth/find-password/complete')
  }

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          새 비밀번호를 입력해 주세요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          이제 새 비밀번호로 로그인할 수 있어요.
        </PFText>
      </div>

      <div className={styles.content}>
        <div className={styles.passwordInputsContainer}>
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
              setSubmitError(null)
            }}
            message={PASSWORD_HELP_TEXT}
          />
          <PFTextInput
            size="xlarge"
            label="새 비밀번호 확인"
            type="password"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onValueChange={value => {
              setConfirmPassword(value)
              setSubmitError(null)
            }}
            message={isMismatch ? PASSWORD_MISMATCH_MESSAGE : undefined}
            messageStatus="error"
            error={isMismatch}
          />
        </div>

        {submitError ? (
          <PFText as="p" typo="bd-sm-md" color="error">
            {submitError}
          </PFText>
        ) : null}

        <PFButton
          size="xlarge"
          width="100%"
          disabled={!canSubmit || resetMutation.isPending}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {resetMutation.isPending ? '변경 중…' : '비밀번호 변경하기'}
        </PFButton>
      </div>
    </section>
  )
}
