import { useEffect, useState } from 'react'
import { PFText } from '@/shared/ui'
import {
  buildIdentityCallbackKey,
  findPasswordIdentityVerificationClient,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
  processIdentityCallback,
} from '@/features/auth/identity-verification'
import styles from '../sign-up/identity-callback.module.css'

const FIND_PASSWORD_IDENTITY_FLOW = 'FIND_PASSWORD'

export function FindPasswordIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      FIND_PASSWORD_IDENTITY_FLOW,
      window.location.search,
    )

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const outcome = await processIdentityCallback(
        findPasswordIdentityVerificationClient,
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
