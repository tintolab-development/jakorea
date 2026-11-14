import { createIdentityVerificationClient } from '@jakorea/identity-verification'

import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { axiosClient } from '@/shared/api'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/**
 * 관리자 회원가입 NICE 본인인증 클라이언트 — flow `ADMIN_SIGNUP` (BE R2 사전 검사 대상).
 * 콜백·mock 경로와 저장 키는 `cmsIdentityVerificationClient`와 같다(flow는 시작 요청에만 쓰인다).
 * 내 정보 재인증은 BE 회신 전까지 `cmsIdentityVerificationClient`(MEMBER_SIGNUP)를 그대로 쓴다.
 */
export const registerIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/register/identity/callback',
    mockPath: '/register/identity/mock',
    resumePath: '/register',
  },
  flow: 'ADMIN_SIGNUP',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  storagePrefix: 'register_identity',
})
