import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { axiosClient } from '@/shared/api'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** CMS 비밀번호 찾기 NICE 본인인증 클라이언트 */
export const findPasswordIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/find-password/identity/callback',
    mockPath: '/find-password/identity/mock',
  },
  flow: 'FIND_PASSWORD',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  storagePrefix: 'find_password_identity',
})
