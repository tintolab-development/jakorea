import { useState } from 'react'
import type { SocialProvider } from '@/entities/user/api/auth-service'
import { buildOAuthAuthorizeUrl } from '@/features/auth/lib/oauth-client'
import { NaverSocialLoginIcon } from '@/shared/ui/icons/NaverSocialLoginIcon'
import { KakaoSocialLoginIcon } from '@/shared/ui/icons/KakaoSocialLoginIcon'
import googleLogoImage from '@/assets/images/logo/google_logo.png'

export function LoginSocialSection() {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)

  const handleSocialLogin = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    try {
      window.location.assign(buildOAuthAuthorizeUrl(provider))
    } catch (error: unknown) {
      console.debug('loginSocialSection redirect failed', error)
      setLoadingProvider(null)
    }
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
