import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  isSocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  processOAuthCallback,
  type SocialProvider,
} from '@jakorea/social-auth'

import { loginWithSocial } from '@/entities/user/api/auth-service'
import { isSocialAuthLoginRemoteEnabled, isSocialAuthSignupRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { ADMIN_REGISTER_TERMS_VERSION } from '@/features/auth/lib/admin-register.constants'
import {
  addConnectedProvider,
  buildRegisterSocialConnectCompletePath,
  buildRegisterSocialConnectFailedPath,
  clearOAuthIntent,
  getOAuthIntent,
  getRegisterSocialRedirect,
} from '@/features/auth/lib/register-social-connect-state'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  buildOAuthLinkCallbackKey,
  isOAuthLinkCallbackHandled,
  markOAuthLinkCallbackHandled,
} from '@/features/auth/social-auth/callback-once'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { handleError, unknownErrorText } from '@/shared/utils/error-handler'

interface OAuthCallbackPageProps {
  provider: SocialProvider
}

export function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const navigate = useNavigate()
  const { setAuth, applySocialAuthTokens } = useAuthStore()
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let redirectTimer: number | undefined

    const execute = async () => {
      const params = new URLSearchParams(window.location.search)
      const oauthIntent = getOAuthIntent()
      const registerRedirect = getRegisterSocialRedirect()

      if (oauthIntent === 'link' && !isSocialAuthSignupRemoteEnabled()) {
        const error = params.get('error')
        const code = params.get('code')
        const state = params.get('state')
        const callbackKey = buildOAuthLinkCallbackKey(provider, code, state)

        if (isOAuthLinkCallbackHandled(callbackKey)) {
          return
        }

        if (error || !code || !cmsSocialAuthClient.state.validateOAuthState(provider, state)) {
          clearOAuthIntent()
          navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
          return
        }

        cmsSocialAuthClient.state.setPendingSocialLink({
          provider,
          code,
          state: state ?? '',
          consent: {
            socialConsentVersion: ADMIN_REGISTER_TERMS_VERSION,
            socialConsentAgreed: true,
          },
        })
        addConnectedProvider(provider)
        clearOAuthIntent()
        markOAuthLinkCallbackHandled(callbackKey)
        navigate(buildRegisterSocialConnectCompletePath(registerRedirect), { replace: true })
        return
      }

      if (oauthIntent === 'link' && isSocialAuthSignupRemoteEnabled()) {
        clearOAuthIntent()
        navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
        return
      }

      const outcome = await processOAuthCallback(cmsSocialAuthClient, provider, params, {
        cancelled,
      })

      if (cancelled) {
        return
      }

      clearOAuthIntent()

      switch (outcome.kind) {
        case 'cancelled':
          return

        case 'failed':
          throw new Error(outcome.message)

        case 'not_linked':
          navigate('/login?socialNotLinked=1', { replace: true })
          return

        case 'already_linked':
          navigate('/login?socialAlreadyLinked=1', { replace: true })
          return

        case 'authenticated': {
          if (isSocialAuthLoginRemoteEnabled()) {
            applySocialAuthTokens(outcome.tokens)
            const target = getRedirectPathByRole(useAuthStore.getState().user)
            navigate(target, { replace: true })
            return
          }

          const mockResponse = await loginWithSocial(provider, params.get('code') ?? '')
          if (mockResponse.requiresMfa) {
            throw new Error('MFA가 필요한 계정입니다. 일반 로그인으로 진행해주세요.')
          }

          setAuth({
            user: mockResponse.user,
            token: mockResponse.token,
            expiresAt: String(mockResponse.expiresAt),
          })

          const target = getRedirectPathByRole(mockResponse.user)
          navigate(target, { replace: true })
          return
        }

        default:
          return
      }
    }

    void execute().catch((err: unknown) => {
      if (isSocialAccountNotLinkedError(err)) {
        navigate('/login?socialNotLinked=1', { replace: true })
        return
      }

      if (isSocialAccountAlreadyLinkedError(err)) {
        navigate('/login?socialAlreadyLinked=1', { replace: true })
        return
      }

      if (cancelled) {
        return
      }

      handleError(err, { context: 'oauthCallbackPage' })
      setOauthError(unknownErrorText(err, '소셜 로그인 처리에 실패했습니다.'))
      redirectTimer = window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    })

    return () => {
      cancelled = true
      if (redirectTimer !== undefined) {
        window.clearTimeout(redirectTimer)
      }
    }
  }, [applySocialAuthTokens, navigate, provider, setAuth])

  return (
    <div className="router-loading-fallback">
      {oauthError ? (
        <Alert type="error" description={oauthError} showIcon style={{ maxWidth: 420 }} />
      ) : (
        <Spin size="large" />
      )}
    </div>
  )
}
