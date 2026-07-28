import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { signupIdentityVerificationClient } from './signup-client'
import { guardianIdentityVerificationClient } from './guardian-client'

export { signupIdentityVerificationClient } from './signup-client'
export { guardianIdentityVerificationClient } from './guardian-client'
export {
  buildIdentityCallbackKey,
  isIdentityCallbackHandled,
  markIdentityCallbackHandled,
} from './identity-callback-once'

export type {
  IdentityChallengeCompleteResult,
  IdentityVerificationClient,
} from '@jakorea/identity-verification'

export {
  processIdentityCallback,
} from '@jakorea/identity-verification'

export type { IdentityVerificationHookStatus } from '@jakorea/identity-verification/react'

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
