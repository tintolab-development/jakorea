const SETTINGS_SOCIAL_LINK_RETURN = '/mypage/settings?tab=social'
const STORAGE_KEY = 'platform.social-link-return'

/** 회원정보 설정에서 시작한 연결은 가입 완료 화면 대신 설정으로 돌아온다. */
export function rememberSettingsSocialLinkReturn(): void {
  sessionStorage.setItem(STORAGE_KEY, SETTINGS_SOCIAL_LINK_RETURN)
}

export function clearSocialLinkReturn(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function consumeSocialLinkReturn(): string | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  if (raw !== SETTINGS_SOCIAL_LINK_RETURN) return null
  return raw
}
