import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'

import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from '@/features/auth/identity-verification/identity-callback-once'
import {
  passwordChangeRequiredIdentityClient,
  processIdentityCallback,
} from '@/features/auth/identity-verification'

const PASSWORD_CHANGE_REQUIRED_IDENTITY_FLOW = 'MEMBER_SIGNUP'

export function PasswordChangeRequiredIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      `password_change_required:${PASSWORD_CHANGE_REQUIRED_IDENTITY_FLOW}`,
      window.location.search
    )

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const outcome = await processIdentityCallback(
        passwordChangeRequiredIdentityClient,
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
