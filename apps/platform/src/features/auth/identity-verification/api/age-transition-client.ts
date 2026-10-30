import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
import { ageTransitionPaths } from '@/features/auth/age-transition/api/endpoints'

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `age14-nice-${Date.now()}`
}

/**
 * 만 14세 회원 전환 전용 NICE.
 * 회원가입 `POST /api/auth/verification-sessions/identity/nice/start` 와 다르다.
 * OpenAPI: POST /api/portal/me/age-transition/nice/start — body 없음, Idempotency-Key optional.
 */
export const ageTransitionIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, _body) =>
      axiosClient.post(url, undefined, {
        headers: { 'Idempotency-Key': createIdempotencyKey() },
      }),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: {
    niceStart: ageTransitionPaths.niceStart,
    identitySession: ageTransitionPaths.niceStatus,
    identityProfile: (sessionId, profileToken) => {
      void profileToken
      return ageTransitionPaths.niceStatus(sessionId)
    },
  },
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
  omitStartRequestBody: true,
  optionalStatusToken: true,
})
