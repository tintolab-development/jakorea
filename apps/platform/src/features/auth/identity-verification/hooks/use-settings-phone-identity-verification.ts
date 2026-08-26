import { useIdentityVerification as useIdentityVerificationBase } from '@jakorea/identity-verification/react'
import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { signupIdentityVerificationClient } from '../api/signup-client'

type UseSettingsPhoneIdentityOptions = {
  name?: string
  birthDate?: string
  gender?: 'male' | 'female' | null
  onSuccess: (result: IdentityChallengeCompleteResult) => void
}

/** 회원정보 수정 연락처 재인증. NICE allowlist상 회원가입 callback URL을 재사용한다. */
export function useSettingsPhoneIdentityVerification(options: UseSettingsPhoneIdentityOptions) {
  return useIdentityVerificationBase({
    client: signupIdentityVerificationClient,
    name: options.name,
    birthDate: options.birthDate,
    gender: options.gender ?? undefined,
    onSuccess: options.onSuccess,
  })
}
