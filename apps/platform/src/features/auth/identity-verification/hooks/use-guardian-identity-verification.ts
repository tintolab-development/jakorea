import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { guardianIdentityVerificationClient } from '../api/guardian-client'

type UseGuardianIdentityOptions = {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useGuardianIdentityVerification(options: UseGuardianIdentityOptions) {
  return useIdentityVerificationBase({
    client: guardianIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}
