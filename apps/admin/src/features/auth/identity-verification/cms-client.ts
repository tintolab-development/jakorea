import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { axiosInstance } from '@/shared/instance/axios-instance'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/** 내 정보 확인 — CMS NICE 본인인증 (연락처 재인증) */
export const adminProfileIdentityClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosInstance.post(url, body),
    get: (url, config) => axiosInstance.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/account/identity/callback',
    mockPath: '/account/identity/mock',
    resumePath: '/',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: () => true,
  storagePrefix: 'admin_profile_identity',
})
