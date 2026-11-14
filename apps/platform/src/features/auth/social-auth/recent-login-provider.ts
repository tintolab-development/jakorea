import { fromApiProviderCode, isSocialProvider, type SocialProvider } from '@jakorea/social-auth'

/**
 * 최근 소셜 로그인 수단 — 브라우저(기기)마다 localStorage에 provider 키만 둔다.
 * 이메일·이름·토큰 등 개인정보는 저장하지 않는다.
 * 키 이름은 `@jakorea/social-auth` state 규칙(`{storagePrefix}_{이름}`)과 Platform prefix를 따른다.
 */
export const RECENT_SOCIAL_LOGIN_PROVIDER_KEY = 'platform_member_oauth_recent_login_provider'

/** 콜백 `provider` 값(kakao 또는 KAKAO 등) → provider 키. 알 수 없으면 null */
export function resolveSocialProviderParam(value: string | null | undefined): SocialProvider | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (isSocialProvider(trimmed)) return trimmed
  return fromApiProviderCode(trimmed)
}

export function rememberRecentSocialLoginProvider(provider: SocialProvider): void {
  try {
    localStorage.setItem(RECENT_SOCIAL_LOGIN_PROVIDER_KEY, provider)
  } catch {
    // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 툴팁 없이 정상 동작한다
  }
}

export function readRecentSocialLoginProvider(): SocialProvider | null {
  try {
    const raw = localStorage.getItem(RECENT_SOCIAL_LOGIN_PROVIDER_KEY)
    return isSocialProvider(raw) ? raw : null
  } catch {
    return null
  }
}
