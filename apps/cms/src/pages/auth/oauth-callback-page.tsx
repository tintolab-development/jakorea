import { useEffect, useRef } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  isSocialAccountAlreadyLinkedError,
  isSocialAccountNotLinkedError,
  processOAuthCallback,
  processOAuthLinkCallback,
  type SocialProvider,
} from '@jakorea/social-auth'

import { loginWithSocial } from '@/entities/user/api/auth-service'
import {
  isSocialAuthLoginRemoteEnabled,
  isSocialAuthSignupRemoteEnabled,
} from '@/features/auth/api/social-auth-remote-capabilities'
import { ADMIN_REGISTER_TERMS_VERSION } from '@/features/auth/lib/admin-register.constants'
import {
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
import { handleError } from '@/shared/utils/error-handler'

const SOCIAL_NOT_LINKED_LOGIN_PATH = '/login?socialNotLinked=1'
const SOCIAL_ALREADY_LINKED_LOGIN_PATH = '/login?socialAlreadyLinked=1'

function isMfaRequiredLoginError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('MFA')
}

function buildLinkSuccessPath(registerRedirect?: string) {
  if (registerRedirect?.startsWith('/')) {
    return registerRedirect
  }
  return buildRegisterSocialConnectCompletePath(registerRedirect)
}

interface OAuthCallbackPageProps {
  provider: SocialProvider
}

export function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const navigate = useNavigate()
  const { setAuth, applySocialAuthTokens } = useAuthStore()
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
      const params = new URLSearchParams(window.location.search)
      const oauthIntent = getOAuthIntent()
      const registerRedirect = getRegisterSocialRedirect()

      if (oauthIntent === 'link') {
        const code = params.get('code')
        const state = params.get('state')
        const callbackKey = buildOAuthLinkCallbackKey(provider, code, state)

        if (isOAuthLinkCallbackHandled(callbackKey)) {
          navigate(buildLinkSuccessPath(registerRedirect), { replace: true })
          return
        }

        if (!isSocialAuthSignupRemoteEnabled()) {
          const error = params.get('error')

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
          cmsSocialAuthClient.state.addConnectedProvider(provider)
          clearOAuthIntent()
          markOAuthLinkCallbackHandled(callbackKey)
          navigate(buildLinkSuccessPath(registerRedirect), { replace: true })
          return
        }

        const linkOutcome = await processOAuthLinkCallback(cmsSocialAuthClient, provider, params, {
          consent: {
            socialConsentVersion: ADMIN_REGISTER_TERMS_VERSION,
            socialConsentAgreed: true,
          },
        })

        clearOAuthIntent()
        markOAuthLinkCallbackHandled(callbackKey)

        switch (linkOutcome.kind) {
          case 'linked':
            navigate(buildLinkSuccessPath(registerRedirect), { replace: true })
            return
          case 'cancelled':
            navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
            return
          case 'failed':
            handleError(new Error(linkOutcome.message), { context: 'oauthCallbackPage.linkFailed' })
            navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
            return
          default:
            navigate(buildRegisterSocialConnectFailedPath(registerRedirect), { replace: true })
            return
        }
      }

      const outcome = await processOAuthCallback(cmsSocialAuthClient, provider, params)

      clearOAuthIntent()

      switch (outcome.kind) {
        case 'cancelled':
          navigateSocialNotLinked()
          return

        case 'failed':
          handleError(new Error(outcome.message), { context: 'oauthCallbackPage.loginFailed' })
          navigateSocialNotLinked()
          return

        case 'not_linked':
          navigateSocialNotLinked()
          return

        case 'already_linked':
          navigate(SOCIAL_ALREADY_LINKED_LOGIN_PATH, { replace: true })
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
        handleError(err, { context: 'oauthCallbackPage.mfaRequired' })
        navigate('/login', { replace: true })
        return
      }

      handleError(err, { context: 'oauthCallbackPage.unexpected' })
      navigateSocialNotLinked()
    })
  }, [applySocialAuthTokens, navigate, provider, setAuth])

  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}
