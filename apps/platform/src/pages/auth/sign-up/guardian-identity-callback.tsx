import { useEffect, useState } from 'react'
import { PFText } from '@/shared/ui'
import {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from '@/features/auth/identity-verification'
import {
  closeIdentityPopupOrResume,
  deliverIdentityMessage,
  type IdentityMessage,
} from '@jakorea/identity-verification'
import { pollGuardianSignupStatus } from '@/features/auth/sign-up/api/guardian-signup-bridge/client'
import {
  GUARDIAN_IDENTITY_COMPLETION_PREFIX,
  readGuardianSignupBridgeState,
} from '@/features/auth/sign-up/lib/guardian-signup-bridge-storage'
import { resolveGuardianBridgeError } from '@/features/auth/sign-up/lib/guardian/guardian-bridge-errors'
import styles from './identity-callback.module.css'

const GUARDIAN_BRIDGE_CALLBACK_FLOW = 'GUARDIAN_SIGNUP_BRIDGE'
const GUARDIAN_RESUME_PATH = '/auth/sign-up'

function deliverGuardianIdentity(message: IdentityMessage): boolean {
  const { delivered } = deliverIdentityMessage(message, GUARDIAN_IDENTITY_COMPLETION_PREFIX)
  if (delivered) {
    closeIdentityPopupOrResume(GUARDIAN_RESUME_PATH)
  }
  return delivered
}

export function SignUpGuardianIdentityCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noOpener, setNoOpener] = useState(false)

  useEffect(() => {
    const callbackKey = buildIdentityCallbackKey(
      GUARDIAN_BRIDGE_CALLBACK_FLOW,
      window.location.search,
    )

    if (isIdentityCallbackHandled(callbackKey)) {
      return
    }

    markIdentityCallbackHandled(callbackKey)

    const execute = async () => {
      const params = new URLSearchParams(window.location.search)
      const queryError = params.get('error')
      const queryMessage = params.get('message') ?? params.get('errorMessage')

      if (queryError) {
        const message = queryMessage ?? '보호자 본인인증에 실패했습니다.'
        const posted = deliverGuardianIdentity({ type: 'IDENTITY_FAILED', message })
        if (!posted) {
          setNoOpener(true)
          setErrorMessage(message)
        }
        return
      }

      const bridge = readGuardianSignupBridgeState()
      const sessionIdRaw =
        params.get('sessionId') ??
        params.get('session_id') ??
        String(bridge?.identitySessionId ?? '')
      const identitySessionId = Number(sessionIdRaw)

      if (!bridge || !sessionIdRaw || Number.isNaN(identitySessionId) || identitySessionId <= 0) {
        const message = '인증 세션 정보가 없습니다. 회원가입 화면에서 다시 시도해 주세요.'
        const posted = deliverGuardianIdentity({ type: 'IDENTITY_FAILED', message })
        if (!posted) {
          setNoOpener(true)
          setErrorMessage(message)
        }
        return
      }

      try {
        const status = await pollGuardianSignupStatus({
          guardianSessionId: bridge.guardianSessionId,
          statusToken: bridge.guardianStatusToken,
        })

        if (status?.identityVerified !== true) {
          const message = '본인인증이 완료되지 않았습니다. 다시 시도해 주세요.'
          const posted = deliverGuardianIdentity({ type: 'IDENTITY_FAILED', message })
          if (!posted) {
            setNoOpener(true)
            setErrorMessage(message)
          }
          return
        }

        const posted = deliverGuardianIdentity({
          type: 'IDENTITY_VERIFIED',
          sessionId: identitySessionId,
          verifiedAt: new Date().toISOString(),
        })
        if (posted) {
          return
        }

        setNoOpener(true)
        setErrorMessage('부모 창을 찾을 수 없습니다. 회원가입 탭으로 돌아가 주세요.')
      } catch (error) {
        const message = resolveGuardianBridgeError(error).message
        const posted = deliverGuardianIdentity({ type: 'IDENTITY_FAILED', message })
        if (!posted) {
          setNoOpener(true)
          setErrorMessage(message)
        }
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
        보호자 본인인증을 확인하는 중이에요…
      </PFText>
    </div>
  )
}
