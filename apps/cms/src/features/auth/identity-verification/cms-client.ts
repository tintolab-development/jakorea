import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { axiosClient } from '@/shared/api'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** CMS 회원가입 NICE 본인인증 클라이언트 */
export const cmsIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: url => axiosClient.get(url),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/register/identity/callback',
    mockPath: '/register/identity/mock',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  storagePrefix: 'register_identity',
})
