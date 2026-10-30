import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import {
  clearAgeTransitionIdentityPending,
  ensureAgeTransitionChoice,
  markAgeTransitionIdentityPending,
} from '@/features/auth/age-transition'
import { ageTransitionIdentityVerificationClient } from '../api/age-transition-client'

type UseMemberConversionIdentityOptions = {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

/**
 * 만 14세 회원 전환 NICE.
 * POST /api/portal/me/age-transition/nice/start (회원 Bearer).
 * 가입용 POST /api/auth/verification-sessions/identity/nice/start (MEMBER_SIGNUP) 와 분리.
 */
export function useMemberConversionIdentityVerification(
  options: UseMemberConversionIdentityOptions,
) {
  const verification = useIdentityVerificationBase({
    client: ageTransitionIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })

  return {
    ...verification,
    verify: async () => {
      markAgeTransitionIdentityPending()
      try {
        await ensureAgeTransitionChoice('TRANSITION')
      } catch (error) {
        clearAgeTransitionIdentityPending()
        throw error
      }
      return verification.verify()
    },
  }
}
