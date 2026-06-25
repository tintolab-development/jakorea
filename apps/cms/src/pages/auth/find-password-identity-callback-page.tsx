import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'

import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from '@/features/auth/identity-verification/identity-callback-once'
import {
  findPasswordIdentityVerificationClient,
  processIdentityCallback,
} from '@/features/auth/identity-verification'

const FIND_PASSWORD_IDENTITY_FLOW = 'FIND_PASSWORD'

export function FindPasswordIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      FIND_PASSWORD_IDENTITY_FLOW,
      window.location.search
    )

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const outcome = await processIdentityCallback(
        findPasswordIdentityVerificationClient,
        new URLSearchParams(window.location.search)
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
      <div className="router-loading-fallback">
        <Alert
          type={noOpener ? 'warning' : 'error'}
          description={errorMessage}
          showIcon
          style={{ maxWidth: 420 }}
        />
      </div>
    )
  }

  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}
