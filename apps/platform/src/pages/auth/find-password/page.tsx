import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FIND_PASSWORD_VERIFICATION_TTL_MS,
  MOCK_FIND_PASSWORD_NOT_FOUND_EMAIL,
  isEmailRegisteredForPasswordReset,
  setFindPasswordRecoveryState,
  usePortalEmailCheckMutation,
} from '@/features/auth/find-password'
import {
  useFindPasswordIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { normalizeEmailId, validateEmailId } from '@/shared/lib/email-id'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const EMAIL_NOT_FOUND_MESSAGE =
  '가입한 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'
const IDENTITY_MISMATCH_MESSAGE = '본인인증 정보가 회원 정보와 일치하지 않습니다.'

export function FindPasswordPage() {
  const navigate = useNavigate()
  const remoteApi = isRemoteApiConfigured()
  const emailCheckMutation = usePortalEmailCheckMutation()
  const pendingEmailRef = useRef('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [identityError, setIdentityError] = useState<string | null>(null)

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      const verifiedEmail = pendingEmailRef.current
      if (!verifiedEmail) {
        setIdentityError('이메일 정보가 없습니다. 처음부터 다시 진행해 주세요.')
        return
      }

      const profileToken = result.profileToken?.trim() ?? ''
      if (remoteApi && !profileToken) {
        setIdentityError('본인인증 정보가 부족합니다. 다시 시도해 주세요.')
        return
      }

      setFindPasswordRecoveryState({
        email: verifiedEmail,
        identityVerificationSessionId: result.sessionId,
        profileToken,
        expiresAt: Date.now() + FIND_PASSWORD_VERIFICATION_TTL_MS,
      })
      navigate('/auth/find-password/reset')
    },
    [navigate, remoteApi],
  )

  const { verify, isVerifying, errorMessage, resetError } = useFindPasswordIdentityVerification({
    onSuccess: handleIdentitySuccess,
  })

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError(null)
    }
    if (identityError) {
      setIdentityError(null)
    }
    resetError()
  }

  const handleVerify = async () => {
    if (isVerifying || emailCheckMutation.isPending) {
      return
    }

    setIdentityError(null)
    resetError()

    const validation = validateEmailId(email)
    if (!validation.ok) {
      setEmailError(validation.message)
      return
    }

    const normalizedEmail = validation.normalized

    try {
      if (remoteApi) {
        const result = await emailCheckMutation.mutateAsync({
          email: normalizedEmail,
          purpose: 'PASSWORD_RESET',
        })
        if (!isEmailRegisteredForPasswordReset(result)) {
          setEmailError(result.message?.trim() || EMAIL_NOT_FOUND_MESSAGE)
          return
        }
      } else if (normalizedEmail === normalizeEmailId(MOCK_FIND_PASSWORD_NOT_FOUND_EMAIL)) {
        setEmailError(EMAIL_NOT_FOUND_MESSAGE)
        return
      }
    } catch (error) {
      setEmailError(getLoginApiErrorMessage(error, '이메일 확인에 실패했어요. 다시 시도해 주세요.'))
      return
    }

    pendingEmailRef.current = normalizedEmail
    try {
      await verify()
    } catch (error) {
      setIdentityError(getLoginApiErrorMessage(error, IDENTITY_MISMATCH_MESSAGE))
    }
  }

  const displayError = emailError ?? identityError ?? errorMessage
  const busy = isVerifying || emailCheckMutation.isPending

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          비밀번호를 다시 설정할게요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          가입한 이메일과 본인 인증이 필요해요.
        </PFText>
      </div>

      <div className={styles.content}>
        <PFTextInput
          size="xlarge"
          label="이메일"
          type="email"
          placeholder="이메일을 입력해 주세요"
          autoComplete="email"
          required
          value={email}
          onValueChange={handleEmailChange}
          error={Boolean(displayError)}
          message={displayError ?? undefined}
          messageStatus="error"
        />

        <PFButton size="xlarge" width="100%" disabled={busy} onClick={() => void handleVerify()}>
          {busy ? '본인인증 진행 중…' : '본인인증 하기'}
        </PFButton>
      </div>
    </section>
  )
}
