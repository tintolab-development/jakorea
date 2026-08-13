import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { axiosClient } from '@/shared/api'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

/** 최초 로그인 passwordChangeRequired NICE 본인인증 클라이언트 */
export const passwordChangeRequiredIdentityClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: passwordChangeRequiredPaths.identityCallback,
    mockPath: passwordChangeRequiredPaths.identityMock,
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  storagePrefix: 'password_change_required_identity',
})
