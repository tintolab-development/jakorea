/**
 * 소셜 로그인 아이콘 영역 — CMS 로그인과 동일 레이아웃
 * Homepage Admin 소셜 SSO는 후속 Phase (클릭 시 안내)
 */

import { message } from 'antd'
import { KakaoSocialLoginIcon } from '@/shared/ui/icons/kakao-social-login-icon'
import { NaverSocialLoginIcon } from '@/shared/ui/icons/naver-social-login-icon'
import googleLogoImage from '@/assets/images/logo/google_logo.png'

type SocialProvider = 'google' | 'naver' | 'kakao'

/** 로그인 화면 소셜 버튼만 숨김. 핸들러·후속 SSO 연동은 유지. */
export const SHOW_SOCIAL_LOGIN_UI = false

export function startLoginSocialOAuth(provider: SocialProvider): void {
  message.info(`소셜 로그인(${provider})은 이후 Phase에서 연동합니다.`)
}

export function LoginSocialSection() {
  if (!SHOW_SOCIAL_LOGIN_UI) {
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
