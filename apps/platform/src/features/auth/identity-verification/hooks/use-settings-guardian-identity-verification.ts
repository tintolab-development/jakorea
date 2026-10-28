import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { signupIdentityVerificationClient } from '../api/signup-client'

type UseSettingsGuardianIdentityOptions = {
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

/** 회원정보 수정 보호자 재인증. NICE allowlist상 회원가입 callback URL을 재사용한다. */
export function useSettingsGuardianIdentityVerification(
  options: UseSettingsGuardianIdentityOptions,
) {
  return useIdentityVerificationBase({
    client: signupIdentityVerificationClient,
    requireBirthGender: false,
    requireName: false,
    onSuccess: options.onSuccess,
  })
}
