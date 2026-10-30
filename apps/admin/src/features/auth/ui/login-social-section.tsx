/**
 * 소셜 로그인 아이콘 영역 — CMS 로그인과 동일 레이아웃
 * Homepage Admin 소셜 SSO는 후속 Phase (클릭 시 안내)
 */

import { message } from 'antd'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { KakaoSocialLoginIcon } from '@/shared/ui/icons/kakao-social-login-icon'
import { NaverSocialLoginIcon } from '@/shared/ui/icons/naver-social-login-icon'
import googleLogoImage from '@/assets/images/logo/google_logo.png'

type SocialProvider = 'google' | 'naver' | 'kakao'

/** @deprecated SOCIAL_ACCOUNT_LINK_ENABLED 와 동일. 기존 import 호환용. */
export const SHOW_SOCIAL_LOGIN_UI = SOCIAL_ACCOUNT_LINK_ENABLED

export function startLoginSocialOAuth(provider: SocialProvider): void {
  message.info(`소셜 로그인(${provider})은 이후 Phase에서 연동합니다.`)
}

export function LoginSocialSection() {
  if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
    return null
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
          aria-label="Google 로그인"
          onClick={() => startLoginSocialOAuth('google')}
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
          aria-label="네이버 로그인"
          onClick={() => startLoginSocialOAuth('naver')}
        >
          <NaverSocialLoginIcon className="login-social-icon__image" />
        </button>
        <button
          type="button"
          className="login-social-icon"
          aria-label="카카오 로그인"
          onClick={() => startLoginSocialOAuth('kakao')}
        >
          <KakaoSocialLoginIcon className="login-social-icon__image" />
        </button>
      </div>
    </div>
  )
}
