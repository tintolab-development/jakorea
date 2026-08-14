import { useEffect, useState } from 'react'
import { PFText } from '@/shared/ui'
import { isAdminProvisionedIdentityConfirmPending } from '@/features/auth/admin-registered'
import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
  processIdentityCallback,
  signupIdentityVerificationClient,
} from '@/features/auth/identity-verification'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import styles from './identity-callback.module.css'

const SIGNUP_IDENTITY_FLOW = 'MEMBER_SIGNUP'

/**
 * 관리자 등록 온보딩도 NICE allowlist상 signup callback URL을 재사용한다.
 * admin pending이면 profile GET을 건너뛰어 profileToken을 부모 창 confirm에 남긴다.
 */
export function SignUpIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(SIGNUP_IDENTITY_FLOW, window.location.search)

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const skipVerifiedProfileFetch = isAdminProvisionedIdentityConfirmPending()

      try {
        const outcome = await processIdentityCallback(
          signupIdentityVerificationClient,
          new URLSearchParams(window.location.search),
          { skipVerifiedProfileFetch },
        )

        if (outcome.kind === 'verified' || outcome.kind === 'cancelled') {
          return
        }

        if (outcome.kind === 'failed') {
          setNoOpener(outcome.noOpener)
          setErrorMessage(outcome.message)
        }
      } catch (error) {
        setNoOpener(false)
        setErrorMessage(
          getLoginApiErrorMessage(error, '본인인증 정보를 확인할 수 없습니다. 다시 시도해 주세요.'),
        )
      }
    }

    void execute()
  }, [])

  if (errorMessage) {
    return (
      <div className={styles.fallback}>
        <PFText as="p" typo="bd-md-sb" color={noOpener ? 'neutral-warm-600' : 'error'}>
          {errorMessage}
        </PFText>
      </div>
    )
  }

  return (
    <div className={styles.fallback}>
      <PFText as="p" typo="bd-md-md" color="neutral-warm-600">
        본인인증을 확인하는 중이에요…
      </PFText>
    </div>
  )
}
