import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'

import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from '@/features/auth/identity-verification/identity-callback-once'
import {
  cmsIdentityVerificationClient,
  processIdentityCallback,
} from '@/features/auth/identity-verification'

const REGISTER_IDENTITY_FLOW = 'MEMBER_SIGNUP'

export function RegisterIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      REGISTER_IDENTITY_FLOW,
      window.location.search
    )

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      try {
        const outcome = await processIdentityCallback(
          cmsIdentityVerificationClient,
          new URLSearchParams(window.location.search)
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
          error instanceof Error
            ? error.message
            : '본인인증 정보를 확인할 수 없습니다. 다시 시도해 주세요.'
        )
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
