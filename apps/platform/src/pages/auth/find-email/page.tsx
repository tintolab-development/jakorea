import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import { lookupFindEmail, stashFoundEmail } from '@/features/auth/find-email'
import {
  getIdentityApiErrorMessage,
  useFindEmailIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const IDENTITY_ERROR_MESSAGE = '본인인증에 실패했어요. 다시 시도해 주세요.'
const LOOKUP_ERROR_MESSAGE = '이메일 찾기에 실패했어요. 다시 시도해 주세요.'

function normalizeName(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

export function FindEmailPage() {
  const navigate = useNavigate()
  const remoteApi = isRemoteApiConfigured()
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const runLookup = useCallback(
    async (identityResult: IdentityChallengeCompleteResult) => {
      const profileToken = identityResult.profileToken?.trim()
      if (remoteApi && !profileToken) {
        setSubmitError('본인인증 정보가 부족합니다. 다시 시도해 주세요.')
        return
      }

      setIsLookupLoading(true)
      setSubmitError(null)

      try {
        const result = await lookupFindEmail({
          identityVerificationSessionId: identityResult.sessionId,
          profileToken: profileToken ?? '',
          mockNotFoundHint: normalizeName(identityResult.verifiedName),
        })

        if (result.kind === 'found') {
          // 원문 이메일은 history.state에 싣지 않고 메모리로만 넘긴다.
          stashFoundEmail(result.email)
          navigate('/auth/find-email/complete', { replace: true })
          return
        }

        navigate('/auth/find-email/not-found', { replace: true })
      } catch (error) {
        setSubmitError(getLoginApiErrorMessage(error, LOOKUP_ERROR_MESSAGE))
      } finally {
        setIsLookupLoading(false)
      }
    },
    [navigate, remoteApi],
  )

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      void runLookup(result)
    },
    [runLookup],
  )

  const { verify, isVerifying, errorMessage, resetError } = useFindEmailIdentityVerification({
    onSuccess: handleIdentitySuccess,
  })

  const handleFindEmail = async () => {
    if (isVerifying || isLookupLoading) {
      return
    }

    setSubmitError(null)
    resetError()

    try {
      await verify()
    } catch (error) {
      // BE가 NICE start 실패를 INVALID_CREDENTIALS(로그인 문구)로 내릴 수 있음 → 본인인증 문구로 치환
      setSubmitError(getIdentityApiErrorMessage(error, IDENTITY_ERROR_MESSAGE))
    }
  }

  const displayError = submitError ?? (isLookupLoading ? null : errorMessage)
  const busy = isVerifying || isLookupLoading

  return (
    <section>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          가입한 이메일을 찾아드릴게요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          본인 확인 후 가입한 이메일을 확인할 수 있어요
        </PFText>
      </div>

      <div className={styles.content}>
        <div className={styles.identityModule}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
            {IDENTITY_MODULE_IDLE_TITLE}
            <br />
            {IDENTITY_MODULE_IDLE_DESCRIPTION}
          </PFText>
        </div>

        {displayError ? (
          <PFText as="p" typo="bd-sm-md" color="error" className={styles.errorMessage}>
            {displayError}
          </PFText>
        ) : null}

        <PFButton
          size="xlarge"
          className={styles.submitButton}
          disabled={busy}
          onClick={() => void handleFindEmail()}
        >
          {busy ? '본인인증 진행 중…' : '본인인증 후 이메일 찾기'}
        </PFButton>
      </div>
    </section>
  )
}
