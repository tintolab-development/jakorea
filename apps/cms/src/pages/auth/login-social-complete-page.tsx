import { useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  isSocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  processSocialLoginSessionReturn,
} from '@jakorea/social-auth'

import { isSocialAuthLoginRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { handleError } from '@/shared/utils/error-handler'

const SOCIAL_NOT_LINKED_LOGIN_PATH = '/login?socialNotLinked=1'
const SOCIAL_ALREADY_LINKED_LOGIN_PATH = '/login?socialAlreadyLinked=1'

function isMfaRequiredLoginError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('MFA')
}

export function LoginSocialCompletePage() {
  const navigate = useNavigate()
  const { applySocialAuthTokens } = useAuthStore()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const navigateSocialNotLinked = () => {
      navigate(SOCIAL_NOT_LINKED_LOGIN_PATH, { replace: true })
    }

    const execute = async () => {
      if (!isSocialAuthLoginRemoteEnabled()) {
        navigate('/login', { replace: true })
        return
      }

      const params = new URLSearchParams(window.location.search)
      const outcome = await processSocialLoginSessionReturn(cmsSocialAuthClient, params)

      switch (outcome.kind) {
        case 'cancelled':
          navigateSocialNotLinked()
          return

        case 'failed':
          handleError(new Error(outcome.message), { context: 'loginSocialCompletePage.failed' })
          navigateSocialNotLinked()
          return

        case 'not_linked':
          navigateSocialNotLinked()
          return

        case 'already_linked':
          navigate(SOCIAL_ALREADY_LINKED_LOGIN_PATH, { replace: true })
          return

        case 'mfa_required': {
          const mfaParams = new URLSearchParams({
            challengeUuid: outcome.challengeUuid,
          })
          if (outcome.mfaMethod) {
            mfaParams.set('mfaMethod', outcome.mfaMethod)
          }
          navigate(`/auth/mfa?${mfaParams.toString()}`, { replace: true })
          return
        }

        case 'authenticated': {
          applySocialAuthTokens(outcome.tokens)
          const target = getRedirectPathByRole(useAuthStore.getState().user)
          navigate(target, { replace: true })
          return
        }

        default:
          navigateSocialNotLinked()
          return
      }
    }

    void execute().catch((err: unknown) => {
      if (isSocialAccountNotLinkedError(err)) {
        navigateSocialNotLinked()
        return
      }

      if (isSocialAccountAlreadyLinkedError(err)) {
        navigate(SOCIAL_ALREADY_LINKED_LOGIN_PATH, { replace: true })
        return
      }

      if (isMfaRequiredLoginError(err)) {
        handleError(err, { context: 'loginSocialCompletePage.mfaRequired' })
        navigate('/login', { replace: true })
        return
      }

      handleError(err, { context: 'loginSocialCompletePage.unexpected' })
      navigateSocialNotLinked()
    })
  }, [applySocialAuthTokens, navigate])

  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}
