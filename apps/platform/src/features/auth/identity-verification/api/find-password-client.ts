import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** 홈페이지 비밀번호 찾기 NICE 본인인증 */
export const findPasswordIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/find-password/identity/callback',
    mockPath: '/auth/find-password/identity/mock',
  },
  flow: 'FIND_PASSWORD',
  isRemoteEnabled: isRemoteApiConfigured,
  storagePrefix: 'platform_find_password_identity',
})
