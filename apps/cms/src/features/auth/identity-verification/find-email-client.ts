import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { axiosClient } from '@/shared/api'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** CMS 이메일 찾기 NICE 본인인증 클라이언트 */
export const findEmailIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: url => axiosClient.get(url),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/find-email/identity/callback',
    mockPath: '/find-email/identity/mock',
  },
  flow: 'FIND_EMAIL',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  storagePrefix: 'find_email_identity',
})
