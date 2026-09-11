import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { findEmailIdentityVerificationClient } from '../api/find-email-client'

type UseFindEmailIdentityVerificationOptions = {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useFindEmailIdentityVerification(options: UseFindEmailIdentityVerificationOptions) {
  return useIdentityVerificationBase({
    client: findEmailIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}
