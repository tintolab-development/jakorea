import type { SocialProvider } from '@/entities/user/api/auth-service'
import googleLogoImage from '@/assets/images/logo/google_logo.png'
import { KakaoSocialLoginIcon } from '@/shared/ui/icons/KakaoSocialLoginIcon'
import { NaverSocialLoginIcon } from '@/shared/ui/icons/NaverSocialLoginIcon'

interface SocialConnectProviderIconProps {
  provider: SocialProvider
  className?: string
}

export function SocialConnectProviderIcon({ provider, className }: SocialConnectProviderIconProps) {
  const iconClassName = className ? `${className} register-social-connect__icon` : 'register-social-connect__icon'

  if (provider === 'google') {
    return (
      <img
        src={googleLogoImage}
        alt=""
        className={iconClassName}
        width={40}
        height={40}
      />
    )
  }

  if (provider === 'naver') {
    return <NaverSocialLoginIcon className={iconClassName} width={40} height={40} />
  }

  return <KakaoSocialLoginIcon className={iconClassName} width={40} height={40} />
}
