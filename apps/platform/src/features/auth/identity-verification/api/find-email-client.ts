import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** 홈페이지 이메일 찾기 NICE 본인인증 */
export const findEmailIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/find-email/identity/callback',
    mockPath: '/auth/find-email/identity/mock',
  },
  flow: 'FIND_EMAIL',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  remoteOnly: true,
  storagePrefix: 'platform_find_email_identity',
})
