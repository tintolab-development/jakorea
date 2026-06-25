import {
  createAdminSsoAdapter,
  createCompositeRemoteAdapter,
  createMockSocialAuthAdapter,
  createSignupSocialAdapter,
  createSocialAuthClient,
  createSocialAuthState,
  type CallbackInput,
} from '@jakorea/social-auth'

import type { OAuthIntent } from '@jakorea/social-auth'

import { loginWithSocial } from '@/entities/user/api/auth-service'
import {
  isSocialAuthLoginRemoteEnabled,
  isSocialAuthSignupRemoteEnabled,
  isSocialAdminSocialApiRemoteEnabled,
} from '@/features/auth/api/social-auth-remote-capabilities'
import { resolveOAuthRedirectOrigin } from '@/features/auth/lib/oauth-redirect-origin'
import { axiosClient } from '@/shared/api'
import { adminSocialAuthPaths } from '@/shared/config/social-auth-paths'

const oauthConfig = {
  clientIds: {
    kakao: import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined,
    naver: import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined,
    google: import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined,
  },
  resolveOrigin: resolveOAuthRedirectOrigin,
} as const

const routes = {
  callbackPath: '/oauth/{provider}',
  signupReturnPath: '/register/social-connect/callback',
} as const

const storagePrefix = 'cms_admin_oauth'

const socialAuthState = createSocialAuthState({ storagePrefix })

const httpClient = {
  post: (url: string, body?: unknown) => axiosClient.post(url, body),
  get: (url: string) => axiosClient.get(url),
  delete: (url: string) => axiosClient.delete(url),
}

const adminSsoAdapter = createAdminSsoAdapter({
  http: httpClient,
  paths: adminSocialAuthPaths,
})

const signupSocialAdapter = createSignupSocialAdapter({
  http: httpClient,
  paths: adminSocialAuthPaths,
})

/** CMS 관리자 소셜 인증 클라이언트 */
export const cmsSocialAuthClient = createSocialAuthClient({
  http: httpClient,
  paths: adminSocialAuthPaths,
  routes,
  oauthConfig,
  /** 로그인: Kakao/Naver/Google authorize URL은 프론트 생성 → `/oauth/{provider}` 콜백 후 code는 실 API 교환 */
  useFrontendOAuthStart: intent => intent === 'login',
  isRemoteEnabled: (intent?: OAuthIntent) => {
    if (intent === 'login') {
      return isSocialAuthLoginRemoteEnabled()
    }
    if (intent === 'link') {
      return isSocialAuthSignupRemoteEnabled()
    }
    return isSocialAdminSocialApiRemoteEnabled()
  },
  storagePrefix,
  state: socialAuthState,
  getAccessToken: () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  remoteAdapter: createCompositeRemoteAdapter({
    adminSso: adminSsoAdapter,
    signupSocial: signupSocialAdapter,
  }),
  mockAdapter: createMockSocialAuthAdapter({
    oauthConfig,
    callbackPath: routes.callbackPath,
    createOAuthState: provider => socialAuthState.createOAuthState(provider),
    mockLogin: async (input: CallbackInput) => {
      const response = await loginWithSocial(input.provider, input.code ?? '')
      return {
        accessToken: response.token,
        refreshToken: `mock-refresh-${response.token}`,
        expiresInSeconds: 86400,
        user: response.user,
        requiresMfa: response.requiresMfa,
      }
    },
  }),
})

export { socialAuthState as cmsSocialAuthState }
