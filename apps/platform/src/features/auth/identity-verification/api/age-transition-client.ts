import type { AxiosRequestConfig } from 'axios'
import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `age14-nice-${Date.now()}`
}

type ForceAuthConfig = AxiosRequestConfig & { forceAuth?: boolean }

/**
 * 만 14세 회원 전환 본인인증.
 * 회원가입과 같은 NICE 팝업 진입점이지만 flow는 AGE14_TRANSITION.
 * POST /api/auth/verification-sessions/identity/nice/start
 * (POST /api/portal/me/age-transition/nice/start 가 아님)
 */
export const ageTransitionIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) =>
      axiosClient.post(url, body, {
        forceAuth: true,
        headers: { 'Idempotency-Key': createIdempotencyKey() },
      } as ForceAuthConfig),
    get: (url, config) =>
      axiosClient.get(url, { ...config, forceAuth: true } as ForceAuthConfig),
  },
  paths: identityVerificationPaths,
  routes: {
    callbackPath: '/auth/sign-up/identity/callback',
    mockPath: '/auth/sign-up/identity/mock',
    resumePath: '/auth/member-conversion/identity',
  },
  flow: 'AGE14_TRANSITION',
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  remoteOnly: true,
  storagePrefix: 'platform_age14_identity',
  omitExpectedProfileOnStart: true,
  optionalStatusToken: true,
})
