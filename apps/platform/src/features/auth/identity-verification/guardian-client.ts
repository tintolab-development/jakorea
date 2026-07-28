import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/**
 * 만 14세 미만 보호자 본인인증.
 * NICE identity 세션을 사용하고, 가입 요청의 `guardianVerificationSessionId`로 전달한다.
 */
export const guardianIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/sign-up/guardian-identity/callback',
    mockPath: '/auth/sign-up/guardian-identity/mock',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isRemoteApiConfigured,
  storagePrefix: 'platform_signup_guardian_identity',
})
