import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { type SocialProvider, SOCIAL_PROVIDER_LABEL } from '@/entities/user/api/auth-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { exchangeOAuthCode } from '@/features/auth/api/oauth-exchange'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { validateOAuthState } from '@/features/auth/lib/oauth-client'
import { isSocialAccountNotLinkedError } from '@/features/auth/errors/social-account-not-linked-error'
import { isSocialAccountAlreadyLinkedError } from '@/features/auth/errors/social-account-already-linked-error'
import { handleError, unknownErrorText } from '@/shared/utils/error-handler'

interface OAuthCallbackPageProps {
  provider: SocialProvider
}

export function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let redirectTimer: number | undefined

    const execute = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')

      if (error) {
        throw new Error(`${SOCIAL_PROVIDER_LABEL[provider]} 로그인 요청이 취소되었거나 실패했습니다.`)
      }

      if (!code) {
        throw new Error('인가 코드가 없어 소셜 로그인을 진행할 수 없습니다.')
      }

      if (!validateOAuthState(provider, state)) {
        throw new Error('OAuth state 검증에 실패했습니다. 다시 시도해주세요.')
      }

      const response = await exchangeOAuthCode({
        provider,
        code,
        state: state ?? '' })

      if (response.requiresMfa) {
        throw new Error('MFA가 필요한 계정입니다. 일반 로그인으로 진행해주세요.')
      }

      setAuth({
        user: response.user,
        token: response.token,
        expiresAt: String(response.expiresAt) })

      const target = getRedirectPathByRole(response.user)
      navigate(target, { replace: true })
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

      // Strict Mode 1차 effect cleanup 이후에는 UI 업데이트·지연 리다이렉트만 무시
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
  }, [navigate, provider, setAuth])

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
