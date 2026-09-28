import {
  createMockSocialAuthAdapter,
  createPortalSsoAdapter,
  createSocialAuthClient,
  createSocialAuthState,
  toApiProviderCode,
  type OAuthIntent,
  type SocialProvider,
} from '@jakorea/social-auth'

import { axiosClient } from '@/shared/api'
import { getAccessToken } from '@/shared/lib'

import { resolveBackendApiOrigin } from './oauth-backend-origin'
import { resolveOAuthRedirectOrigin } from './oauth-redirect-origin'
import { portalSocialAuthPaths } from './paths'
import {
  isPortalSocialAuthLinkRemoteEnabled,
  isPortalSocialAuthLoginRemoteEnabled,
} from './remote-capabilities'

const oauthConfig = {
  clientIds: {
    kakao: import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined,
    naver: import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined,
    google: import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined,
  },
  resolveOrigin: resolveOAuthRedirectOrigin,
} as const

const routes = {
  callbackPath: '/auth/oauth/{provider}',
  signupReturnPath: '/auth/sign-up/social-connect/callback',
  loginCompletePath: '/auth/social/complete',
} as const

const storagePrefix = 'platform_member_oauth'

const socialAuthState = createSocialAuthState({ storagePrefix })

const httpClient = {
  post: (url: string, body?: unknown) => axiosClient.post(url, body),
  get: (url: string) => axiosClient.get(url),
  delete: (url: string) => axiosClient.delete(url),
}

function resolveBackendSsoCallbackUri(
  provider: SocialProvider,
  intent: 'login' | 'link'
): string {
  const base = resolveBackendApiOrigin()
  const seg = toApiProviderCode(provider).toLowerCase()
  if (intent === 'link') {
    return `${base}${portalSocialAuthPaths.linkProviderCallback(seg)}`
  }
  return `${base}${portalSocialAuthPaths.ssoProviderCallback(seg)}`
}

const portalSsoAdapter = createPortalSsoAdapter({
  http: httpClient,
  paths: portalSocialAuthPaths,
  resolveBackendCallbackUri: resolveBackendSsoCallbackUri,
})

/** Platform 회원 소셜 인증 클라이언트 */
export const platformSocialAuthClient = createSocialAuthClient({
  http: httpClient,
  paths: portalSocialAuthPaths,
  routes,
  oauthConfig,
  isRemoteEnabled: (intent?: OAuthIntent) => {
    if (intent === 'login') {
      return isPortalSocialAuthLoginRemoteEnabled()
    }
    return isPortalSocialAuthLinkRemoteEnabled()
  },
  storagePrefix,
  state: socialAuthState,
  getAccessToken: () => getAccessToken(),
  remoteAdapter: portalSsoAdapter,
  mockAdapter: createMockSocialAuthAdapter({
    oauthConfig,
    callbackPath: routes.callbackPath,
    createOAuthState: provider => socialAuthState.createOAuthState(provider),
  }),
})
