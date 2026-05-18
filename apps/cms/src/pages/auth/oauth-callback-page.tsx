import { useEffect, useState } from 'react'
import { Alert, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { type SocialProvider, SOCIAL_PROVIDER_LABEL } from '@/entities/user/api/auth-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { exchangeOAuthCode } from '@/features/auth/api/oauth-exchange'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { validateOAuthState } from '@/features/auth/lib/oauth-client'
import { handleError, unknownErrorText } from '@/shared/utils/error-handler'

interface OAuthCallbackPageProps {
  provider: SocialProvider
}

export function OAuthCallbackPage({ provider }: OAuthCallbackPageProps) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
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

      // window.alert(
      //   `[소셜 로그인 성공]\n\n${JSON.stringify(callbackInfo, null, 2)}`
      // )

      setAuth({
        user: response.user,
        token: response.token,
        expiresAt: String(response.expiresAt) })

      const target = getRedirectPathByRole(response.user)
      navigate(target, { replace: true })
    }

    execute().catch((err: unknown) => {
      handleError(err, { context: 'oauthCallbackPage' })
      setOauthError(unknownErrorText(err, '소셜 로그인 처리에 실패했습니다.'))
      window.setTimeout(() => navigate('/login', { replace: true }), 2000)
    })
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
