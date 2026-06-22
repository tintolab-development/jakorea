import { useEffect } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { processSignupSocialReturn } from '@jakorea/social-auth'

import { isSocialAuthSignupRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { ADMIN_REGISTER_TERMS_VERSION } from '@/features/auth/lib/admin-register.constants'
import {
  addConnectedProvider,
  buildRegisterSocialConnectCompletePath,
  buildRegisterSocialConnectFailedPath,
  clearOAuthIntent,
  getRegisterSocialRedirect,
} from '@/features/auth/lib/register-social-connect-state'
import {
  buildSignupCallbackKey,
  isSignupCallbackHandled,
  markSignupCallbackHandled,
} from '@/features/auth/social-auth/callback-once'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { handleError } from '@/shared/utils/error-handler'

export function RegisterSocialSignupCallbackPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()

  useEffect(() => {
    const abortController = new AbortController()
    const callbackKey = buildSignupCallbackKey(window.location.search)

    if (isSignupCallbackHandled(callbackKey)) {
      return
    }

    const execute = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const registerRedirect = params.redirect ?? getRegisterSocialRedirect()

      if (!isSocialAuthSignupRemoteEnabled()) {
        if (searchParams.has('socialVerificationSessionId')) {
          clearOAuthIntent()
          navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
          return
        }

        const provider = searchParams.get('provider')
        if (
          provider === 'google' ||
          provider === 'naver' ||
          provider === 'kakao'
        ) {
          addConnectedProvider(provider)
        }
        clearOAuthIntent()
        markSignupCallbackHandled(callbackKey)
        navigate(buildRegisterSocialConnectCompletePath(registerRedirect), { replace: true })
        return
      }

      const outcome = await processSignupSocialReturn(cmsSocialAuthClient, searchParams, {
        cancelled: abortController.signal.aborted,
        consent: {
          socialConsentVersion: ADMIN_REGISTER_TERMS_VERSION,
          socialConsentAgreed: true,
        },
      })

      if (abortController.signal.aborted) {
        return
      }

      clearOAuthIntent()
      markSignupCallbackHandled(callbackKey)

      switch (outcome.kind) {
        case 'linked':
          navigate(buildRegisterSocialConnectCompletePath(registerRedirect), { replace: true })
          return
        case 'cancelled':
        case 'failed':
          navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
          return
        default:
          return
      }
    }

    void execute().catch((err: unknown) => {
      if (abortController.signal.aborted) {
        return
      }
      const registerRedirect = params.redirect ?? getRegisterSocialRedirect()
      clearOAuthIntent()
      markSignupCallbackHandled(callbackKey)
      handleError(err, { context: 'registerSocialSignupCallbackPage' })
      navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
    })

    return () => {
      abortController.abort()
    }
  }, [navigate, params.redirect])

  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}
