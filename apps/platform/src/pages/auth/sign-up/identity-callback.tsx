import { useEffect, useState } from 'react'
import { PFText } from '@/shared/ui'
import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
  processIdentityCallback,
  signupIdentityVerificationClient,
} from '@/features/auth/identity-verification'
import styles from './identity-callback.module.css'

const SIGNUP_IDENTITY_FLOW = 'MEMBER_SIGNUP'

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
      const outcome = await processIdentityCallback(
        signupIdentityVerificationClient,
        new URLSearchParams(window.location.search),
      )

      if (outcome.kind === 'verified' || outcome.kind === 'cancelled') {
        return
      }

      if (outcome.kind === 'failed') {
        setNoOpener(outcome.noOpener)
        setErrorMessage(outcome.message)
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
