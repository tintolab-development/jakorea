import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
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
    resumePath: '/auth/sign-up',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  remoteOnly: true,
  storagePrefix: 'platform_signup_identity',
})
