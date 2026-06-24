import { useState } from 'react'

import type { SocialProvider } from '@jakorea/social-auth'
import { SocialAuthApiError } from '@jakorea/social-auth'

import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { handleError } from '@/shared/utils/error-handler'
import { NaverSocialLoginIcon } from '@/shared/ui/icons/NaverSocialLoginIcon'
import { KakaoSocialLoginIcon } from '@/shared/ui/icons/KakaoSocialLoginIcon'
import googleLogoImage from '@/assets/images/logo/google_logo.png'

export function LoginSocialSection() {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)

  const handleSocialLogin = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    void cmsSocialAuthClient
      .startLogin({ provider, intent: 'login' })
      .then(url => {
        if (!url?.trim()) {
          throw new SocialAuthApiError('INVALID_RESPONSE', '소셜 로그인 URL을 받지 못했습니다.')
        }
        if (import.meta.env.DEV) {
          console.info(
            `[social-auth] redirect_uri=${cmsSocialAuthClient.getRedirectUri(provider)}`
          )
        }
        window.location.assign(url)
      })
      .catch((error: unknown) => {
        handleError(error, { context: 'loginSocialSection.startLogin' })
        if (import.meta.env.DEV) {
          console.info(
            `[social-auth] Kakao 콘솔 > 카카오 로그인 > Redirect URI 등록 필요: ${cmsSocialAuthClient.getRedirectUri(provider)}`
          )
        }
        setLoadingProvider(null)
      })
  }

  return (
    <div className="login-social-section" aria-label="소셜 로그인">
      <div className="login-social-divider">
        <span>또는 소셜 로그인</span>
      </div>
      <div className="login-social-icons">
        <button
          type="button"
          className="login-social-icon"
          disabled={loadingProvider !== null}
          aria-label="Google 로그인"
          onClick={() => handleSocialLogin('google')}
        >
          <img
            src={googleLogoImage}
            alt=""
            className="login-social-icon__image"
            width={54}
            height={54}
          />
        </button>
        <button
          type="button"
          className="login-social-icon"
          disabled={loadingProvider !== null}
          aria-label="네이버 로그인"
          onClick={() => handleSocialLogin('naver')}
        >
          <NaverSocialLoginIcon className="login-social-icon__image" />
        </button>
        <button
          type="button"
          className="login-social-icon"
          disabled={loadingProvider !== null}
          aria-label="카카오 로그인"
          onClick={() => handleSocialLogin('kakao')}
        >
          <KakaoSocialLoginIcon className="login-social-icon__image" />
        </button>
      </div>
    </div>
  )
}
