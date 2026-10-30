import { createIdentityVerificationClient } from '@jakorea/identity-verification'
import type { IdentityVerificationPaths } from '@jakorea/identity-verification'
import { ageTransitionPaths } from '@/features/auth/age-transition/api/endpoints'
import {
  AGE14_NICE_IDENTITY_CALLBACK_PATH,
  AGE14_NICE_IDENTITY_FLOW,
  AGE14_NICE_IDENTITY_MOCK_PATH,
} from '@/features/auth/age-transition/lib/identity-callback-contract'
import { axiosClient } from '@/shared/api/axios-instance'
import { isIdentityVerificationRemoteEnabled } from '@/shared/config/identity-verification-remote-capabilities'
import { identityVerificationPaths } from '@/shared/config/identity-verification-paths'

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `age14-nice-${Date.now()}`
}

/** 만 14세 전환 — portal NICE (공개 `/api/auth/.../identity/nice/start` 사용 금지) */
export const ageTransitionIdentityVerificationPaths: IdentityVerificationPaths = {
  niceStart: ageTransitionPaths.niceStart,
  identitySession: ageTransitionPaths.niceStatus,
  /** skipVerifiedProfileFetch 시 미사용 — 타입 계약용 */
  identityProfile: identityVerificationPaths.identityProfile,
}

/**
 * 만 14세 회원 전환 NICE.
 * - start/status: 회원 Bearer + `/api/portal/me/age-transition/nice/*`
 * - NICE return: BE `JA_NICE_AGE14_FRONTEND_RETURN_URL` → `/auth/age-transition/identity/callback`
 */
export const ageTransitionIdentityVerificationClient = createIdentityVerificationClient({
  http: {
    post: (url, body) =>
      axiosClient.post(url, body, {
        headers: { 'Idempotency-Key': createIdempotencyKey() },
      }),
    get: (url, config) => axiosClient.get(url, config),
  },
  paths: ageTransitionIdentityVerificationPaths,
  routes: {
    callbackPath: AGE14_NICE_IDENTITY_CALLBACK_PATH,
    mockPath: AGE14_NICE_IDENTITY_MOCK_PATH,
    resumePath: '/auth/member-conversion/identity',
  },
  flow: AGE14_NICE_IDENTITY_FLOW,
  isRemoteEnabled: isIdentityVerificationRemoteEnabled,
  remoteOnly: true,
  storagePrefix: 'platform_age14_identity',
  omitExpectedProfileOnStart: true,
  omitStartRequestBody: true,
  optionalStatusToken: true,
})
