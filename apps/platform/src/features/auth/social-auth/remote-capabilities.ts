import { isRemoteApiConfigured } from '@/shared/lib'

/** Portal SSO login — `/api/portal/auth/sso/login/**` */
export function isPortalSocialAuthLoginRemoteEnabled(): boolean {
  return isRemoteApiConfigured()
}

/** 가입 직후 / 계정 연결 — `/api/portal/me/sso/**` */
export function isPortalSocialAuthLinkRemoteEnabled(): boolean {
  return isRemoteApiConfigured()
}
