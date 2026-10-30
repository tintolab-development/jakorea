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
 * 회원가입 identity/nice/start 가 아니라 POST /api/portal/me/age-transition/nice/start 를 쓴다.
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
