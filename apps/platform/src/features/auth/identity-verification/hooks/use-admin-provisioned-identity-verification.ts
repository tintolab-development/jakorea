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
    /** start는 expected*를 보내지 않음. 로그인 직후 wizard에 생년월일이 없어도 팝업을 연다. */
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}
