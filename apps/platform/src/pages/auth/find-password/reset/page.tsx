import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFindPasswordRecoveryState,
  clearFindPasswordRecoveryState,
  usePortalPasswordResetConfirmMutation,
} from '@/features/auth/find-password'
import { isValidMemberPassword, MEMBER_PASSWORD_HELP_TEXT } from '@/features/auth/sign-up'
import { getLoginApiErrorMessage, isPasswordRecentlyUsedApiError } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { NETWORK_ERROR_INLINE_MESSAGE } from '@/shared/lib/network-error-message'
import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal, PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const PASSWORD_HELP_TEXT = MEMBER_PASSWORD_HELP_TEXT
const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.'
const IDENTITY_REQUIRED_MESSAGE = '본인인증 정보가 없습니다. 처음부터 다시 진행해 주세요.'

export function FindPasswordResetPage() {
  const navigate = useNavigate()
  const remoteApi = isRemoteApiConfigured()
  const resetMutation = usePortalPasswordResetConfirmMutation()
  const [recovery] = useState(() => getFindPasswordRecoveryState())
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  /** 최근 사용한 비밀번호 재사용 — 시안 「비밀번호 재사용 시」 팝업 */
  const [passwordReusedOpen, setPasswordReusedOpen] = useState(false)

  useEffect(() => {
    if (!recovery) {
      navigate('/auth/find-password', { replace: true })
    }
  }, [navigate, recovery])

  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit =
    isValidMemberPassword(newPassword) &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

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
        if (isPasswordRecentlyUsedApiError(error)) {
          setPasswordReusedOpen(true)
          return
        }
        // 비밀번호 재설정은 로그인이 아니므로 ACCOUNT_INACTIVE 등은 서버 메시지를 그대로 쓴다.
        // 응답 본문이 없는 오류(502 등)는 네트워크 오류 안내를 쓴다(인라인 문구라 제목·본문 두 줄).
        setSubmitError(
          getLoginApiErrorMessage(error, NETWORK_ERROR_INLINE_MESSAGE, {
            overrideApprovalPending: false,
          }),
        )
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
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
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
          <PFText as="p" typo="bd-sm-md" color="error" className={styles.submitError}>
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
      <PFAlertModal
        open={passwordReusedOpen}
        title={PLATFORM_ALERT_COPY.passwordRecentlyUsed.title}
        description={PLATFORM_ALERT_COPY.passwordRecentlyUsed.description}
        onConfirm={() => setPasswordReusedOpen(false)}
      />
    </section>
  )
}
