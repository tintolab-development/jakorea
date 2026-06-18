import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'

import {
  cmsIdentityVerificationClient,
  processIdentityCallback,
} from '@/features/auth/identity-verification'

export function RegisterIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    let cancelled = false

    const execute = async () => {
      const outcome = await processIdentityCallback(
        cmsIdentityVerificationClient,
        new URLSearchParams(window.location.search),
        { cancelled }
      )

      if (cancelled || outcome.kind === 'verified' || outcome.kind === 'cancelled') {
        return
      }

      if (outcome.kind === 'failed') {
        setNoOpener(outcome.noOpener)
        setErrorMessage(outcome.message)
      }
    }

    void execute()

    return () => {
      cancelled = true
    }
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
