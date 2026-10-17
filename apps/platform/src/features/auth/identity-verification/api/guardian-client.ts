import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/**
 * @deprecated 만 14세 미만은 Guardian Bridge(`useGuardianBridgeVerification`)만 사용한다.
 * `guardianVerificationSessionId`는 Challenge sessionId이며 NICE Identity sessionId와 다르다.
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
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  remoteOnly: true,
  storagePrefix: 'platform_signup_guardian_identity',
})
