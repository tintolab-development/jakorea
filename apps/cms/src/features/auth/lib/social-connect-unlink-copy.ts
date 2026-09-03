import type { SocialProvider } from '@jakorea/social-auth'

const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'Google',
  naver: '네이버',
  kakao: '카카오',
}

export function getSocialConnectUnlinkConfirmContent(provider: SocialProvider): string {
  const label = SOCIAL_PROVIDER_LABEL[provider]
  return `${label} 계정 연결을 해제할까요?\n해제 후에는 해당 소셜 계정으로 로그인할 수 없습니다.`
}
