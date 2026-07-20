import type { SocialProvider } from '@jakorea/social-auth'
import { buildOAuthAuthorizeUrl as buildPackageOAuthAuthorizeUrl } from '@jakorea/social-auth'

import { isSocialAuthSignupRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'

/** @deprecated `cmsSocialAuthClient.getRedirectUri`를 사용하세요 */
export function getOAuthRedirectUri(provider: SocialProvider): string {
  return cmsSocialAuthClient.getRedirectUri(provider)
}

/** @deprecated `cmsSocialAuthClient.state.createOAuthState`를 사용하세요 */
export function createOAuthState(provider: SocialProvider): string {
  return cmsSocialAuthClient.state.createOAuthState(provider)
}

/** @deprecated `cmsSocialAuthClient.state.validateOAuthState`를 사용하세요 */
export function validateOAuthState(provider: SocialProvider, state: string | null): boolean {
  return cmsSocialAuthClient.state.validateOAuthState(provider, state)
}

/** @deprecated `cmsSocialAuthClient.startLogin`을 사용하세요. remote 가입·연결은 signup session API를 씁니다. */
export function buildOAuthAuthorizeUrl(provider: SocialProvider): string {
  if (import.meta.env.DEV && isSocialAuthSignupRemoteEnabled()) {
    console.warn(
      '[oauth-client] buildOAuthAuthorizeUrl: remote 모드에서는 가입·연결에 cmsSocialAuthClient.startLogin({ intent: "link" })를 사용하세요.'
    )
  }
  const state = cmsSocialAuthClient.state.createOAuthState(provider)
  return buildPackageOAuthAuthorizeUrl(
    cmsSocialAuthClient.oauthConfig,
    cmsSocialAuthClient.routes.callbackPath,
    provider,
    state
  )
}
