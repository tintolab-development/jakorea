import { describe, expect, it } from 'vitest'
import {
  AGE14_NICE_IDENTITY_CALLBACK_PATH,
  AGE14_NICE_IDENTITY_FLOW,
} from '../src/features/auth/age-transition/lib/identity-callback-contract'
import {
  ageTransitionIdentityVerificationClient,
  ageTransitionIdentityVerificationPaths,
} from '../src/features/auth/identity-verification/api/age-transition-client'

describe('AGE14 transition NICE API paths', () => {
  it('NICE 콜백은 가입 path 와 분리', () => {
    expect(AGE14_NICE_IDENTITY_CALLBACK_PATH).toBe('/auth/age-transition/identity/callback')
    expect(ageTransitionIdentityVerificationClient.flow).toBe(AGE14_NICE_IDENTITY_FLOW)
  })

  it('start/status는 portal age-transition (공개 identity nice/start 아님)', () => {
    expect(ageTransitionIdentityVerificationPaths.niceStart()).toBe(
      '/api/portal/me/age-transition/nice/start',
    )
    expect(ageTransitionIdentityVerificationPaths.identitySession(42)).toBe(
      '/api/portal/me/age-transition/nice/42',
    )
    expect(ageTransitionIdentityVerificationPaths.niceStart()).not.toContain(
      '/api/auth/verification-sessions/identity/nice/start',
    )
  })
})
