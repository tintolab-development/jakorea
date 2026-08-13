import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { signupIdentityVerificationClient } from '../api/signup-client'

type UseSignupIdentityOptions = {
  birthDate?: string
  gender?: 'male' | 'female' | null
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useSignupIdentityVerification(options: UseSignupIdentityOptions) {
  return useIdentityVerificationBase({
    client: signupIdentityVerificationClient,
    birthDate: options.birthDate,
    gender: options.gender ?? undefined,
    onSuccess: options.onSuccess,
  })
}
