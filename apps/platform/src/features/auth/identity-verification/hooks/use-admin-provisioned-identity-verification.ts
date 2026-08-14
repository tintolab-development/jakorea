import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { adminProvisionedIdentityVerificationClient } from '../api/admin-provisioned-client'

type UseAdminProvisionedIdentityOptions = {
  birthDate?: string
  gender?: 'male' | 'female' | null
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

export function useAdminProvisionedIdentityVerification(
  options: UseAdminProvisionedIdentityOptions
) {
  return useIdentityVerificationBase({
    client: adminProvisionedIdentityVerificationClient,
    birthDate: options.birthDate,
    gender: options.gender ?? undefined,
    onSuccess: options.onSuccess,
  })
}
