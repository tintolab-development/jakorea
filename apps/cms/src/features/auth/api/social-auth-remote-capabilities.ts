import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

/** 가입 wizard 소셜 연결 — Admin SSO link (`POST /api/admin/me/sso/accounts` startOAuth + session consume) */
export function isSocialAuthSignupRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('socialAuth')
}

/** 관리자 소셜 로그인 — Admin SSO (`/api/admin/auth/sso/...`) */
export function isSocialAuthLoginRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('socialAuthLogin') || isRealApiModuleEnabled('socialAuth')
}

/** 연결 목록·해제·flush 등 admin social-accounts API */
export function isSocialAdminSocialApiRemoteEnabled(): boolean {
  return isSocialAuthSignupRemoteEnabled() || isSocialAuthLoginRemoteEnabled()
}

/** @deprecated `isSocialAuthSignupRemoteEnabled` 또는 `isSocialAuthLoginRemoteEnabled` 사용 */
export function isSocialAuthRemoteEnabled(): boolean {
  return isSocialAdminSocialApiRemoteEnabled()
}
