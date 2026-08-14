import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { findPasswordIdentityVerificationClient } from '../api/find-password-client'

type UseFindPasswordIdentityOptions = {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useFindPasswordIdentityVerification(options: UseFindPasswordIdentityOptions) {
  return useIdentityVerificationBase({
    client: findPasswordIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}
