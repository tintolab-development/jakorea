import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

/**
 * 관리자 등록 회원 온보딩용 NICE 클라이언트.
 * - flow/callback/storage는 회원가입과 동일 (콜백 페이지 재사용)
 * - start에는 expected*를 보내지 않음 → 사전검증 실패로 팝업이 안 뜨는 문제 회피
 * - 본인 일치 검증은 `/admin-provisioned/identity/confirm`에서 수행
 */
export const adminProvisionedIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) => axiosClient.post(url, body),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/sign-up/identity/callback',
    mockPath: '/auth/sign-up/identity/mock',
  },
  flow: 'MEMBER_SIGNUP',
  isRemoteEnabled: isRemoteApiConfigured,
  /** signup 콜백이 pending challenge를 읽을 수 있도록 동일 prefix */
  storagePrefix: 'platform_signup_identity',
  omitExpectedProfileOnStart: true,
})
