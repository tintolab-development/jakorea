import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** 홈페이지 회원가입(본인) NICE 본인인증 */
export const signupIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/sign-up/identity/callback',
    mockPath: '/auth/sign-up/identity/mock',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isRemoteApiConfigured,
  storagePrefix: 'platform_signup_identity',
})
